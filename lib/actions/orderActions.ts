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
        name: z.string()
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
            bundleId: z.string().optional()
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
    let total = 0;
    let discountTotal = 0;
    let promoCodeId = null;

    const session = await getSession();
    const supabaseAdmin = createAdminClient();

    // 1. Fetch authoritative product prices
    const productIds = [...new Set(items.map(i => i.productId))];
    const { data: dbProducts } = await supabaseAdmin
        .from('products')
        .select('id, base_price')
        .in('id', productIds);

    const productPrices = new Map((dbProducts || []).map(p => [p.id, p.base_price]));

    // 2. Fetch authoritative bundle information
    const bundleIds = [...new Set(items.map(i => i.bundleId).filter(Boolean))] as string[];
    let dbBundles: any[] = [];
    let dbBundleItems: any[] = [];

    if (bundleIds.length > 0) {
        const [bundlesRes, itemsRes] = await Promise.all([
            supabaseAdmin.from('bundles').select('id, price_override').in('id', bundleIds),
            supabaseAdmin.from('bundle_items').select('bundle_id, product_id, quantity').in('bundle_id', bundleIds)
        ]);
        dbBundles = bundlesRes.data || [];
        dbBundleItems = itemsRes.data || [];
    }

    // 3. Securely calculate total
    // First, process standalone items
    const standaloneItems = items.filter(i => !i.bundleId);
    standaloneItems.forEach(item => {
        const basePrice = productPrices.get(item.productId) || 0;
        item.price = basePrice; // Overwrite client price
        total += basePrice * item.quantity;
    });

    // Then process bundle items
    for (const bId of bundleIds) {
        const bundleInfo = dbBundles.find(b => b.id === bId);
        const reqs = dbBundleItems.filter(bi => bi.bundle_id === bId);
        const cItems = items.filter(i => i.bundleId === bId);

        // Aggregate client item quantities by product id to prevent duplicate line exploits
        const aggQty = new Map<string, number>();
        cItems.forEach(c => {
            aggQty.set(c.productId, (aggQty.get(c.productId) || 0) + c.quantity);
        });

        // Find how many complete bundles can be formed
        let bundleCount = reqs.length ? Math.min(...reqs.map(r => {
            const clientQty = aggQty.get(r.product_id) || 0;
            return Math.floor(clientQty / r.quantity);
        })) : 0;

        const overridePrice = bundleInfo?.price_override || 0;
        total += bundleCount * overridePrice;

        // Keep track of how many items we've already accounted for in bundles
        const bundledQtyTracker = new Map<string, number>();
        reqs.forEach(r => {
            bundledQtyTracker.set(r.product_id, bundleCount * r.quantity);
        });

        cItems.forEach(c => {
            const basePrice = productPrices.get(c.productId) || 0;
            c.price = basePrice; // Set individual item price for the order record

            // Determine how many of THIS specific line item are "loose"
            const remainingToBundle = bundledQtyTracker.get(c.productId) || 0;

            if (c.quantity <= remainingToBundle) {
                // This entire line item is part of a bundle
                bundledQtyTracker.set(c.productId, remainingToBundle - c.quantity);
            } else {
                // Only a portion (or none) of this line item is in a bundle
                const looseQty = c.quantity - remainingToBundle;
                total += looseQty * basePrice;
                bundledQtyTracker.set(c.productId, 0); // Used up all bundled items for this product
            }
        });
    }

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
