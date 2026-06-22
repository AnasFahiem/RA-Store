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

export async function placeOrder(formData: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
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
            bundleId: z.string().optional().nullable()
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

    const session = await getSession();
    const supabaseAdmin = createAdminClient();

    // 1. Fetch authoritative product base prices
    const productIds = [...new Set(items.map((i: any) => i.productId))];
    const { data: productsData, error: productsError } = await supabaseAdmin
        .from('products')
        .select('id, base_price')
        .in('id', productIds);

    if (productsError || !productsData) {
        console.error('Failed to fetch product prices:', productsError);
        return { success: false, error: 'Internal pricing error' };
    }

    // 2. Fetch authoritative bundle definitions if any bundles are in the order
    const bundleIds = [...new Set(items.filter((i: any) => i.bundleId).map((i: any) => i.bundleId))];
    let bundlesData: any[] = [];
    if (bundleIds.length > 0) {
        const { data: bData, error: bError } = await supabaseAdmin
            .from('bundles')
            .select('id, price_override, bundle_items(product_id, quantity)')
            .in('id', bundleIds);

        if (!bError && bData) {
            bundlesData = bData;
        } else {
            console.error('Failed to fetch bundle prices:', bError);
        }
    }

    // 3. Calculate authoritative total
    let total = 0;

    // Separate items
    const standaloneItems = items.filter((i: any) => !i.bundleId);
    const bundleGroups: Record<string, any[]> = {};

    items.filter((i: any) => i.bundleId).forEach((item: any) => {
        if (!bundleGroups[item.bundleId]) bundleGroups[item.bundleId] = [];
        bundleGroups[item.bundleId].push(item);
    });

    // Calculate standalone prices
    standaloneItems.forEach((item: any) => {
        const p = productsData.find(x => x.id === item.productId);
        const basePrice = p ? p.base_price : 0;
        total += basePrice * item.quantity;
        item._authoritativePrice = basePrice;
    });

    // Calculate bundle prices
    Object.keys(bundleGroups).forEach(bId => {
        const groupItems = bundleGroups[bId];
        const bundleDef = bundlesData.find(b => b.id === bId);

        // Aggregate submitted quantities by productId
        const submittedQty: Record<string, number> = {};
        groupItems.forEach((i: any) => {
            submittedQty[i.productId] = (submittedQty[i.productId] || 0) + i.quantity;
        });

        if (!bundleDef || !bundleDef.bundle_items || bundleDef.bundle_items.length === 0) {
            // Fallback to base prices if bundle not found or empty
            groupItems.forEach((item: any) => {
                const p = productsData.find(x => x.id === item.productId);
                const basePrice = p ? p.base_price : 0;
                total += basePrice * item.quantity;
                item._authoritativePrice = basePrice;
            });
            return;
        }

        // Determine bundleCount (how many times the full bundle definition is satisfied)
        let bundleCount = Infinity;
        bundleDef.bundle_items.forEach((req: any) => {
            const sub = submittedQty[req.product_id] || 0;
            const possible = Math.floor(sub / req.quantity);
            if (possible < bundleCount) bundleCount = possible;
        });
        if (bundleCount === Infinity) bundleCount = 0;

        // Calculate the price for the bundle portions
        let bundlePrice = bundleDef.price_override;
        if (bundlePrice === null || bundlePrice === undefined) {
            bundlePrice = bundleDef.bundle_items.reduce((sum: number, req: any) => {
                const p = productsData.find(x => x.id === req.product_id);
                return sum + (p ? p.base_price : 0) * req.quantity;
            }, 0);
        }
        total += bundleCount * bundlePrice;

        // Calculate excess portions that are charged at base price
        const excessQty: Record<string, number> = {};
        Object.keys(submittedQty).forEach(pId => {
            const req = bundleDef.bundle_items.find((r: any) => r.product_id === pId);
            const reqQty = req ? req.quantity : 0;
            const excess = submittedQty[pId] - (bundleCount * reqQty);
            excessQty[pId] = excess > 0 ? excess : 0;

            if (excessQty[pId] > 0) {
                const p = productsData.find(x => x.id === pId);
                total += (p ? p.base_price : 0) * excessQty[pId];
            }
        });

        // Tag individual items with base_price for saving into order items (discount handles bundle pricing at order level, or we just store base_price per memory)
        groupItems.forEach((item: any) => {
            const p = productsData.find(x => x.id === item.productId);
            item._authoritativePrice = p ? p.base_price : 0;
        });
    });

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
                price: item._authoritativePrice,
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

        await sendOrderEmail({ order, items, adminEmails });
    } catch (e) {
        console.error('Email failed:', e);
    }

    revalidatePath('/admin/orders');
    return { success: true, orderId: order.id };
}
