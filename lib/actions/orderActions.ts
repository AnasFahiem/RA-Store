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
        bundleDetails: z.object({
            name: z.string(),
            priceOverride: z.number().optional()
        }).optional()
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
            bundleDetails: z.object({
                name: z.string(),
                priceOverride: z.number().optional()
            }).optional()
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
    let discountTotal = 0;
    let promoCodeId = null;

    if (items.length === 0) {
        return { success: false, error: 'Cannot place an order with no items' };
    }

    const session = await getSession();
    const supabaseAdmin = createAdminClient();

    // Server-Side Price Verification
    // 1. Gather all unique product IDs and bundle IDs
    const productIds = Array.from(new Set(items.map(i => i.productId))) as string[];
    const bundleIds = Array.from(new Set(items.map(i => i.bundleId).filter(Boolean))) as string[];

    // 2. Fetch authoritative prices from DB
    const [{ data: dbProducts, error: productsError }, { data: dbBundles, error: bundlesError }] = await Promise.all([
        supabaseAdmin.from('products').select('id, base_price').in('id', productIds),
        bundleIds.length > 0
            ? supabaseAdmin.from('bundles').select('id, price_override, bundle_items(product_id, quantity)').in('id', bundleIds)
            : Promise.resolve({ data: [], error: null })
    ]);

    if (productsError || bundlesError) {
        console.error('Failed to fetch pricing data:', productsError || bundlesError);
        return { success: false, error: 'Internal server error verifying prices' };
    }

    const productPriceMap = new Map(dbProducts?.map(p => [p.id, p.base_price]) || []);
    const bundleMap = new Map(dbBundles?.map(b => [b.id, b]) || []);

    // 3. Calculate secure total and overwrite untrusted client prices
    let total = 0;

    // Separate standalone items from bundled items
    const standaloneItems = items.filter(i => !i.bundleId);
    const bundleGroups = new Map<string, typeof items>();

    for (const item of items) {
        if (!productPriceMap.has(item.productId)) {
             return { success: false, error: `Invalid product in order: ${item.productId}` };
        }
        if (item.bundleId) {
            if (!bundleGroups.has(item.bundleId)) bundleGroups.set(item.bundleId, []);
            bundleGroups.get(item.bundleId)!.push(item);
        }
    }

    // Process standalone items: Price * Quantity
    for (const item of standaloneItems) {
        const dbPrice = productPriceMap.get(item.productId) as number;
        item.price = dbPrice;
        total += dbPrice * item.quantity;
    }

    // Process bundled items: Apply price override per bundle instance
    for (const [bundleId, bundleItems] of bundleGroups.entries()) {
        const bundleRecord = bundleMap.get(bundleId);
        if (!bundleRecord) {
            return { success: false, error: `Invalid bundle in order: ${bundleId}` };
        }

        // Validate bundle items and their quantities against the database definition
        const validBundleItems = bundleRecord.bundle_items as { product_id: string, quantity: number }[] || [];
        const validBundleItemMap = new Map(validBundleItems.map(vi => [vi.product_id, vi.quantity]));

        let bundleInstanceCount = Infinity; // Find the minimum multiplier across all items
        let bundleBaseTotal = 0; // Cost of 1 instance of the bundle based on regular product prices

        // Combine quantities for items with the same productId in the client array
        // to prevent attackers from duplicating a product to bypass the length check
        const combinedClientItems = new Map<string, number>();
        for (const item of bundleItems) {
            combinedClientItems.set(item.productId, (combinedClientItems.get(item.productId) || 0) + item.quantity);
        }

        for (const [productId, totalQty] of combinedClientItems.entries()) {
            const expectedQtyPerBundle = validBundleItemMap.get(productId);
            if (!expectedQtyPerBundle) {
                // Item doesn't belong in this bundle! Reject order.
                return { success: false, error: `Invalid product ${productId} for bundle ${bundleId}` };
            }

            // Calculate how many bundles this item's quantity represents
            // E.g., if bundle requires 2 of Product A, and user sends 6, they are buying 3 bundles.
            if (totalQty % expectedQtyPerBundle !== 0) {
                 return { success: false, error: `Invalid quantity ratio for product ${productId} in bundle ${bundleId}` };
            }

            const instances = totalQty / expectedQtyPerBundle;
            bundleInstanceCount = Math.min(bundleInstanceCount, instances);

            const dbPrice = productPriceMap.get(productId) as number;
            bundleBaseTotal += dbPrice * expectedQtyPerBundle;
        }

        // Ensure ALL items in the client's bundle array agree on the number of instances being purchased
        for (const [productId, totalQty] of combinedClientItems.entries()) {
            const expectedQtyPerBundle = validBundleItemMap.get(productId) as number;
            if (totalQty !== expectedQtyPerBundle * bundleInstanceCount) {
                 return { success: false, error: `Mismatched bundle instance counts for bundle ${bundleId}` };
            }
        }

        // Ensure ALL items required by the bundle definition are present in the client's request
        if (combinedClientItems.size !== validBundleItems.length) {
            return { success: false, error: `Incomplete bundle definition for bundle ${bundleId}` };
        }

        const overridePrice = bundleRecord.price_override;
        // Final price of one bundle instance
        const bundleUnitTotal = (overridePrice !== undefined && overridePrice !== null) ? overridePrice : bundleBaseTotal;

        // Total price for all instances of this bundle
        total += bundleUnitTotal * bundleInstanceCount;

        // Distribute the discounted unit price proportionally across items so order details display correctly
        for (const item of bundleItems) {
             const expectedQtyPerBundle = validBundleItemMap.get(item.productId) as number;
             const dbPrice = productPriceMap.get(item.productId) as number;
             // Contribution of this item to the base bundle total
             const contribution = bundleBaseTotal > 0 ? ((dbPrice * expectedQtyPerBundle) / bundleBaseTotal) : 0;
             // Store the per-unit item price including the bundle discount
             item.price = (contribution * bundleUnitTotal) / expectedQtyPerBundle;
        }
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
