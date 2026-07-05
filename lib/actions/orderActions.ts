'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderEmail } from '@/lib/email';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';



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

    const { name, email, phone, address, city, items, promoCode } = result.data;

    const session = await getSession();
    const supabaseAdmin = createAdminClient();

    // Re-calculate the authoritative price from DB to prevent IDOR/price manipulation
    let total = 0;
    const finalItems = [];

    // Group items by bundleId to process bundle logic
    const bundleGroups = items.reduce((acc: any, item: any) => {
        if (item.bundleId) {
            if (!acc[item.bundleId]) acc[item.bundleId] = [];
            acc[item.bundleId].push(item);
        } else {
            if (!acc['unbundled']) acc['unbundled'] = [];
            acc['unbundled'].push(item);
        }
        return acc;
    }, {});

    for (const bundleId of Object.keys(bundleGroups)) {
        if (bundleId === 'unbundled') {
            for (const item of bundleGroups[bundleId]) {
                const { data: dbProduct } = await supabaseAdmin
                    .from('products')
                    .select('base_price')
                    .eq('id', item.productId)
                    .single();

                const authoritativePrice = dbProduct?.base_price || 0;
                total += authoritativePrice * item.quantity;
                finalItems.push({ ...item, price: authoritativePrice });
            }
        } else {
            const groupItems = bundleGroups[bundleId];
            // Fetch bundle definition and bundle items
            const { data: bundle } = await supabaseAdmin
                .from('bundles')
                .select('price_override, bundle_items(product_id, quantity)')
                .eq('id', bundleId)
                .single();

            if (!bundle) continue;

            // Calculate how many times the bundle is satisfied
            // We need to aggregate quantities of identical products in the submitted items
            const submittedQtyByProduct = groupItems.reduce((acc: any, item: any) => {
                acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
                return acc;
            }, {});

            // Determine max valid bundles formed
            let bundleCount = Number.MAX_SAFE_INTEGER;
            for (const bItem of bundle.bundle_items || []) {
                const subQty = submittedQtyByProduct[bItem.product_id] || 0;
                const possible = Math.floor(subQty / bItem.quantity);
                if (possible < bundleCount) bundleCount = possible;
            }
            if (bundleCount === Number.MAX_SAFE_INTEGER) bundleCount = 0;

            let bundleTotal = 0;
            // Calculate base price for individual items if there's no override
            for (const item of groupItems) {
                const { data: dbProduct } = await supabaseAdmin
                    .from('products')
                    .select('base_price')
                    .eq('id', item.productId)
                    .single();
                const basePrice = dbProduct?.base_price || 0;

                // Keep track for DB storage
                finalItems.push({ ...item, price: basePrice });
                bundleTotal += basePrice * item.quantity;
            }

            // Apply bundle override pricing if applicable
            if (bundle.price_override !== null && bundle.price_override !== undefined && bundleCount > 0) {
                 // The bundle items satisfy bundleCount full bundles.
                 // We add the bundle overridden price for the full bundles:
                 const overriddenTotalForBundles = bundle.price_override * bundleCount;


                 // Simplified: Since we have the total of base prices for all items in this group,
                 // and we know how many full bundles we have, we subtract the base price of the items consumed by the bundles,
                 // and add the overridden bundle price.
                 let consumedBasePriceTotal = 0;
                 for (const bItem of bundle.bundle_items || []) {
                      const { data: dbProduct } = await supabaseAdmin
                          .from('products')
                          .select('base_price')
                          .eq('id', bItem.product_id)
                          .single();
                      consumedBasePriceTotal += (dbProduct?.base_price || 0) * bItem.quantity * bundleCount;
                 }
                 total += bundleTotal - consumedBasePriceTotal + overriddenTotalForBundles;
            } else {
                 total += bundleTotal;
            }
        }
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
            items: finalItems.map((item: any) => ({
                product_id: item.productId,
                quantity: item.quantity,
                price: item.price,
                name: item.name,
                variant: item.variant,
                bundle_id: item.bundleId || null
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

        await sendOrderEmail({ order, items: finalItems, adminEmails });
    } catch (e) {
        console.error('Email failed:', e);
    }

    revalidatePath('/admin/orders');
    return { success: true, orderId: order.id };
}
