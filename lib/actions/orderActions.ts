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
            bundleId: z.string().optional()
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

    const session = await getSession();
    const supabaseAdmin = createAdminClient();

    // 🛡️ SECURITY: Fetch authoritative prices from DB
    const productIds = [...new Set(items.map(i => i.productId))];
    const { data: dbProducts } = await supabaseAdmin
        .from('products')
        .select('id, base_price')
        .in('id', productIds);

    const productsMap = new Map((dbProducts || []).map(p => [p.id, p.base_price]));

    const bundleIds = [...new Set(items.map(i => i.bundleId).filter(Boolean) as string[])];
    let bundlesMap = new Map();
    if (bundleIds.length > 0) {
        const { data: dbBundles } = await supabaseAdmin
            .from('bundles')
            .select('id, price_override, items:bundle_items(product_id, quantity)')
            .in('id', bundleIds);

        bundlesMap = new Map((dbBundles || []).map(b => [b.id, b]));
    }

    let total = 0;

    // Separate items
    const standaloneItems = items.filter(i => !i.bundleId);
    const bundleItems = items.filter(i => i.bundleId);

    // Calculate standalone total
    for (const item of standaloneItems) {
        const basePrice = productsMap.get(item.productId) || 0;
        total += basePrice * item.quantity;
    }

    // Group bundle items by bundleId
    const groupedBundles = bundleItems.reduce((acc, item) => {
        const bid = item.bundleId!;
        if (!acc[bid]) acc[bid] = [];
        acc[bid].push(item);
        return acc;
    }, {} as Record<string, typeof items>);

    // Calculate bundles total securely
    for (const [bundleId, bItems] of Object.entries(groupedBundles)) {
        const bundle = bundlesMap.get(bundleId);

        // If bundle is invalid, charge all items at base price
        if (!bundle) {
            for (const item of bItems) {
                const basePrice = productsMap.get(item.productId) || 0;
                total += basePrice * item.quantity;
            }
            continue;
        }

        // Aggregate client quantities by product
        const clientQtys = bItems.reduce((acc, item) => {
            acc[item.productId] = (acc[item.productId] || 0) + item.quantity;
            return acc;
        }, {} as Record<string, number>);

        // Calculate how many complete bundles we have based on requirements
        let bundleCount = Infinity;
        for (const req of bundle.items) {
            const clientQty = clientQtys[req.product_id] || 0;
            const possible = Math.floor(clientQty / req.quantity);
            if (possible < bundleCount) bundleCount = possible;
        }

        if (bundleCount === Infinity || bundleCount === 0) bundleCount = 0;

        // Add complete bundle prices
        total += bundleCount * (bundle.price_override || 0);

        // Deduct complete bundle items from clientQtys, then charge the remaining at base price
        for (const req of bundle.items) {
            if (clientQtys[req.product_id] !== undefined) {
                clientQtys[req.product_id] -= bundleCount * req.quantity;
            }
        }

        // Charge any remaining (or unrelated) items at base price
        for (const [productId, remainingQty] of Object.entries(clientQtys)) {
            if (remainingQty > 0) {
                const basePrice = productsMap.get(productId) || 0;
                total += remainingQty * basePrice;
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
