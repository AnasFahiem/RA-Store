'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderEmail } from '@/lib/email';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';

const OrderSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    address: z.string().min(5),
    city: z.string().min(2),
    items: z.array(z.object({
        productId: z.string(),
        variant: z.string().nullish(), // Accepts string, null, or undefined
        quantity: z.number().min(1),
        price: z.number(),
        name: z.string(),
        bundleId: z.string().optional(),
        bundleDetails: z.any().optional()
    })),
    saveAddress: z.boolean().optional()
});

export async function getSavedAddresses() {
    const session = await getSession();
    console.log('getSavedAddresses Session:', session);
    if (!session?.userId) {
        console.log('getSavedAddresses: No user ID');
        return [];
    }

    const supabaseAdmin = createAdminClient();

    const { data: addresses, error } = await supabaseAdmin
        .from('addresses')
        .select('*')
        .eq('user_id', session.userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('getSavedAddresses Error:', error);
    }

    console.log('getSavedAddresses Found:', addresses?.length);

    return addresses || [];
}


export async function getUserProfile() {
    const session = await getSession();
    if (!session?.userId) return null;

    const supabaseAdmin = createAdminClient();

    const { data: user } = await supabaseAdmin
        .from('users')
        .select('name, email')
        .eq('id', session.userId)
        .single();

    // Attempt to find latest phone from last order
    const { data: lastOrder } = await supabaseAdmin
        .from('orders')
        .select('shipping_address')
        .eq('user_id', session.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    const lastPhone = lastOrder?.shipping_address && typeof lastOrder.shipping_address !== 'string'
        ? (lastOrder.shipping_address as any).phone
        : '';

    return {
        ...user,
        phone: lastPhone || ''
    };
}

export async function placeOrder(formData: any) {
    console.log('placeOrder received formData:', JSON.stringify(formData, null, 2));

    const OrderSchema = z.object({
        name: z.string().min(2),
        email: z.string().email(),
        phone: z.string().min(10),
        address: z.string().min(5),
        city: z.string().min(2),
        items: z.array(z.object({
            productId: z.string(),
            variant: z.string().nullish(),
            quantity: z.number().min(1),
            price: z.number(),
            name: z.string(),
            bundleId: z.string().optional(),
            bundleDetails: z.any().optional()
        })),
        saveAddress: z.boolean().optional(),
        promoCode: z.string().optional().nullable()
    });

    // ... (inside placeOrder)

    const result = OrderSchema.safeParse(formData);

    if (!result.success) {
        console.error('Order validation errors:', result.error.format());
        return { success: false, error: 'Invalid form data: ' + result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ') };
    }

    const { name, email, phone, address, city, items, saveAddress, promoCode } = result.data;

    const session = await getSession();
    const supabaseAdmin = createAdminClient();

    // Secure Price Calculation
    // 1. Fetch authoritative product prices
    const productIds = Array.from(new Set(items.map(i => i.productId)));
    const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, base_price')
        .in('id', productIds);

    const productPrices = new Map(products?.map(p => [p.id, p.base_price]) || []);

    // 2. Fetch authoritative bundle overrides
    const bundleIds = Array.from(new Set(items.map(i => i.bundleId).filter(Boolean))) as string[];
    let bundleOverrides = new Map<string, number | null>();
    if (bundleIds.length > 0) {
        const { data: bundles } = await supabaseAdmin
            .from('bundles')
            .select('id, price_override')
            .in('id', bundleIds);
        bundleOverrides = new Map(bundles?.map(b => [b.id, b.price_override]) || []);
    }

    // 3. Calculate total securely and overwrite client prices
    let secureTotal = 0;

    // Group items by bundleId
    const standaloneItems = items.filter(i => !i.bundleId);
    const bundleItems = items.filter(i => !!i.bundleId);

    // Calculate standalone items total
    for (const item of standaloneItems) {
        const dbPrice = productPrices.get(item.productId) || 0;
        item.price = dbPrice; // Overwrite client price
        secureTotal += dbPrice * item.quantity;
    }

    // Calculate bundle items total
    const groupedBundles = bundleItems.reduce((acc, item) => {
        if (item.bundleId) {
            if (!acc[item.bundleId]) acc[item.bundleId] = [];
            acc[item.bundleId].push(item);
        }
        return acc;
    }, {} as Record<string, typeof items>);

    for (const [bundleId, group] of Object.entries(groupedBundles)) {
        const override = bundleOverrides.get(bundleId);
        if (override !== undefined && override !== null) {
            // Calculate the total base price for one instance of this bundle
            const singleBundleBasePrice = group.reduce((sum, item) => sum + (productPrices.get(item.productId) || 0), 0);

            // Assume the bundle quantity is represented by the quantity of any item in it
            const bundleQuantity = group[0]?.quantity || 1;

            // The total cost for all quantities of this bundle
            const bundleTotalCost = override * bundleQuantity;
            secureTotal += bundleTotalCost;

            // Distribute the override price proportionally across the items in the bundle
            // so that the sum of the line items matches the bundle total cost.
            for (const item of group) {
                const dbPrice = productPrices.get(item.productId) || 0;
                if (singleBundleBasePrice > 0) {
                    const ratio = dbPrice / singleBundleBasePrice;
                    // The price per unit of this item within the bundle
                    item.price = override * ratio;
                } else {
                    item.price = 0;
                }
            }
        } else {
            for (const item of group) {
                const dbPrice = productPrices.get(item.productId) || 0;
                item.price = dbPrice; // Overwrite client price
                secureTotal += dbPrice * item.quantity;
            }
        }
    }

    let total = secureTotal;
    let discountTotal = 0;
    let promoCodeId = null;

    // Validate and Apply Promo Code
    if (promoCode) {
        const { data: promo } = await supabaseAdmin
            .from('promo_codes')
            .select('*')
            .eq('code', promoCode.toUpperCase())
            .single();

        if (promo && promo.is_active) {
            // Check expiration
            if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
                console.warn('Promo code expired');
            } else if (promo.max_uses && promo.used_count >= promo.max_uses) {
                console.warn('Promo code usage limit reached');
            } else {
                // Apply discount
                if (promo.discount_type === 'percentage') {
                    discountTotal = (total * promo.discount_value) / 100;
                } else {
                    discountTotal = promo.discount_value;
                }

                // Ensure discount doesn't exceed total
                discountTotal = Math.min(discountTotal, total);
                total -= discountTotal;
                promoCodeId = promo.id;

                // Increment usage count
                await supabaseAdmin.rpc('increment_promo_usage', { promo_id: promo.id });
                // Fallback if RPC doesn't exist (though RPC is better for concurrency)
                // await supabaseAdmin.from('promo_codes').update({ used_count: promo.used_count + 1 }).eq('id', promo.id);
            }
        }
    }

    // Save address if requested and user is logged in
    // ... (existing address saving logic)

    const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
            total_amount: total,
            status: 'pending',
            user_id: session?.userId,
            shipping_address: {
                name,
                email,
                phone,
                street: address,
                city
            },
            items: items.map((item: any) => ({
                product_id: item.productId,
                quantity: item.quantity,
                price: item.price,
                name: item.name,
                variant: item.variant
            })),
            promo_code_id: promoCodeId,
            discount_total: discountTotal
        })
        .select()
        .single();

    if (promoCodeId && !orderError) {
        // Increment usage count safely using a raw query or simple update if RPC not set up
        const { error: updateError } = await supabaseAdmin
            .from('promo_codes')
            .update({ used_count: promoCodeId ? ((await supabaseAdmin.from('promo_codes').select('used_count').eq('id', promoCodeId).single()).data?.used_count || 0) + 1 : 0 })
            .eq('id', promoCodeId);

        if (updateError) console.error('Failed to update promo usage count:', updateError);
    }

    if (orderError) {
        console.error('Order creation failed:', orderError);
        return { success: false, error: 'Failed to create order' };
    }

    // Email sending logic below...

    // 3. Send Emails
    try {
        // Fetch all admins and owners
        const { data: admins } = await supabaseAdmin
            .from('users')
            .select('email')
            .or('role.eq.admin,role.eq.owner');

        const adminEmails = admins?.map(a => a.email).filter(Boolean) as string[] || [];

        await sendOrderEmail({ order, items, adminEmails });
    } catch (e) {
        console.error('Email failed:', e);
    }

    revalidatePath('/admin/orders');
    return { success: true, orderId: order.id };
}
