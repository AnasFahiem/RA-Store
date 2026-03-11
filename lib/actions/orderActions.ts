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
        variant: z.string().nullish(),
        quantity: z.number().min(1),
        price: z.number(),
        name: z.string(),
        bundleId: z.string().nullish(),
        bundleDetails: z.object({
            name: z.string().optional(),
            priceOverride: z.number().optional()
        }).nullish()
    })),
    saveAddress: z.boolean().optional(),
    promoCode: z.string().optional().nullable()
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



    // ... (inside placeOrder)

    const result = OrderSchema.safeParse(formData);

    if (!result.success) {
        console.error('Order validation errors:', result.error.format());
        return { success: false, error: 'Invalid form data: ' + result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ') };
    }

    const { name, email, phone, address, city, items, saveAddress, promoCode } = result.data;

    const session = await getSession();
    const supabaseAdmin = createAdminClient();

    // 1. Validate prices server-side
    const productIds = Array.from(new Set(items.map(item => item.productId)));
    const bundleIds = Array.from(new Set(items.map(item => item.bundleId).filter(Boolean)));

    const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, base_price')
        .in('id', productIds);

    const { data: bundles } = bundleIds.length > 0
        ? await supabaseAdmin.from('bundles').select('id, price_override').in('id', bundleIds as string[])
        : { data: [] };

    const { data: bundleItemsData } = bundleIds.length > 0
        ? await supabaseAdmin.from('bundle_items').select('bundle_id, product_id, quantity').in('bundle_id', bundleIds as string[])
        : { data: [] };

    const productMap = new Map(products?.map(p => [p.id, p.base_price]));
    const bundleMap = new Map(bundles?.map(b => [b.id, b.price_override]));
    const bundleItemsMap = new Map<string, { product_id: string, quantity: number }[]>();

    if (bundleItemsData) {
        for (const row of bundleItemsData) {
            if (!bundleItemsMap.has(row.bundle_id)) bundleItemsMap.set(row.bundle_id, []);
            bundleItemsMap.get(row.bundle_id)!.push({ product_id: row.product_id, quantity: row.quantity });
        }
    }

    const { groupedItems, standaloneItems } = items.reduce((acc, item) => {
        if (item.bundleId) {
            if (!acc.groupedItems[item.bundleId]) {
                acc.groupedItems[item.bundleId] = { items: [] };
            }
            acc.groupedItems[item.bundleId].items.push(item);
        } else {
            acc.standaloneItems.push(item);
        }
        return acc;
    }, { groupedItems: {} as Record<string, { items: typeof items }>, standaloneItems: [] as typeof items });

    let standAloneTotal = 0;
    for (const item of standaloneItems) {
        const basePrice = productMap.get(item.productId) || 0;
        standAloneTotal += basePrice * item.quantity;
        item.price = basePrice;
    }

    let bundlesTotal = 0;
    for (const [bundleId, group] of Object.entries(groupedItems)) {
        const override = bundleMap.get(bundleId);
        const expectedItems = bundleItemsMap.get(bundleId) || [];

        // Ensure the items inside the bundle match exactly what the bundle dictates
        const groupProductQtys = new Map<string, number>();
        for (const item of group.items) {
             groupProductQtys.set(item.productId, (groupProductQtys.get(item.productId) || 0) + item.quantity);
        }

        // Figure out the bundle multiplier (how many of this bundle did they buy?)
        // We use the first expected item to find the multiplier, and then verify all other items match this multiplier.
        let bundleMultiplier = 0;
        let isBundleValid = true;

        if (expectedItems.length > 0) {
            const firstExpected = expectedItems[0];
            const actualQty = groupProductQtys.get(firstExpected.product_id) || 0;

            if (actualQty === 0 || actualQty % firstExpected.quantity !== 0) {
                isBundleValid = false;
            } else {
                bundleMultiplier = actualQty / firstExpected.quantity;

                // Verify all expected items match this multiplier
                for (const expected of expectedItems) {
                    if (groupProductQtys.get(expected.product_id) !== expected.quantity * bundleMultiplier) {
                        isBundleValid = false;
                        break;
                    }
                }

                // Verify there are no extra unexpected items in the bundle payload
                if (groupProductQtys.size !== expectedItems.length) {
                    isBundleValid = false;
                }
            }
        } else {
             isBundleValid = false;
        }

        // If a user maliciously altered the bundle, we fallback to pricing it as individual items
        if (!isBundleValid) {
            for (const item of group.items) {
                const basePrice = productMap.get(item.productId) || 0;
                item.price = basePrice;
                bundlesTotal += basePrice * item.quantity;
            }
            continue;
        }

        let groupTotal = 0;
        for (const item of group.items) {
            const basePrice = productMap.get(item.productId) || 0;
            item.price = basePrice;
            groupTotal += basePrice * item.quantity;
        }

        if (override !== undefined && override !== null) {
            bundlesTotal += override * bundleMultiplier;
        } else {
            bundlesTotal += groupTotal;
        }
    }

    let total = standAloneTotal + bundlesTotal;
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
