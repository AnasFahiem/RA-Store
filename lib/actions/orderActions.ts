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
        bundleId: z.string().optional(),
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
            bundleId: z.string().optional(),
            quantity: z.number().min(1),
            price: z.number(),
            name: z.string()
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

    // Secure Pricing: Fetch authoritative prices from database
    const productIds = [...new Set(items.map(i => i.productId))];
    const bundleIds = [...new Set(items.map(i => i.bundleId).filter(Boolean))] as string[];

    // Fetch Products
    const { data: dbProducts, error: productsError } = await supabaseAdmin
        .from('products')
        .select('id, base_price')
        .in('id', productIds);

    if (productsError) {
        console.error('Failed to fetch product prices:', productsError);
        return { success: false, error: 'Internal pricing error' };
    }

    const productPriceMap = new Map(dbProducts?.map(p => [p.id, p.base_price]) || []);

    // Fetch Bundles
    let dbBundles: any[] = [];
    if (bundleIds.length > 0) {
        const { data: bData, error: bError } = await supabaseAdmin
            .from('bundles')
            .select(`
                id,
                price_override,
                is_active,
                bundle_items ( product_id, quantity )
            `)
            .in('id', bundleIds)
            .eq('is_active', true);

        if (bError) {
            console.error('Failed to fetch bundles:', bError);
        } else {
            dbBundles = bData || [];
        }
    }

    const bundleMap = new Map(dbBundles.map(b => [b.id, b]));

    // Calculate Secure Total
    let total = 0;

    // Group items by bundleId
    const standaloneItems = items.filter(i => !i.bundleId);
    const bundledItems = items.filter(i => i.bundleId).reduce((acc, item) => {
        if (!item.bundleId) return acc;
        if (!acc[item.bundleId]) acc[item.bundleId] = [];
        acc[item.bundleId].push(item);
        return acc;
    }, {} as Record<string, typeof items>);

    // Process standalone items
    for (const item of standaloneItems) {
        const basePrice = productPriceMap.get(item.productId) || 0;
        item.price = basePrice; // Overwrite client price with DB price
        total += basePrice * item.quantity;
    }

    // Process bundled items
    for (const [bundleId, groupItems] of Object.entries(bundledItems)) {
        const bundle = bundleMap.get(bundleId);

        if (!bundle || !bundle.price_override) {
            // Bundle invalid or no override, charge standard price
            for (const item of groupItems) {
                const basePrice = productPriceMap.get(item.productId) || 0;
                item.price = basePrice;
                total += basePrice * item.quantity;
            }
            continue;
        }

        // Calculate bundleCount (how many times the full bundle is satisfied)
        let bundleCount = Infinity;
        for (const reqItem of bundle.bundle_items || []) {
            const sumQty = groupItems
                .filter(i => i.productId === reqItem.product_id)
                .reduce((s, i) => s + i.quantity, 0);
            const possibleCount = Math.floor(sumQty / (reqItem.quantity || 1));
            bundleCount = Math.min(bundleCount, possibleCount);
        }

        if (bundleCount === Infinity || bundleCount <= 0 || !bundle.bundle_items?.length) {
            bundleCount = 0;
        }

        // Add bundled price
        total += bundleCount * bundle.price_override;

        // Calculate remaining items and set item base prices
        // Since price is stored per item, we just set item.price to base_price and let the total_amount handle the discount.
        // We need to charge base_price for items exceeding the bundleCount.

        let remainingToCharge = 0;

        // Track how many we consumed for the bundle
        const consumedQtyMap = new Map();
        for (const reqItem of bundle.bundle_items || []) {
            consumedQtyMap.set(reqItem.product_id, bundleCount * (reqItem.quantity || 1));
        }

        for (const item of groupItems) {
            const basePrice = productPriceMap.get(item.productId) || 0;
            item.price = basePrice; // Overwrite client price

            let qtyToChargeBase = item.quantity;
            const consumed = consumedQtyMap.get(item.productId) || 0;

            if (consumed > 0) {
                if (qtyToChargeBase >= consumed) {
                    qtyToChargeBase -= consumed;
                    consumedQtyMap.set(item.productId, 0);
                } else {
                    consumedQtyMap.set(item.productId, consumed - qtyToChargeBase);
                    qtyToChargeBase = 0;
                }
            }

            remainingToCharge += qtyToChargeBase * basePrice;
        }

        total += remainingToCharge;
    }

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
