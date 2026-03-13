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
        bundleId: z.string().optional().nullable(),
        bundleDetails: z.object({
            priceOverride: z.number().optional().nullable()
        }).optional().nullable()
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
            bundleId: z.string().optional().nullable(),
            bundleDetails: z.object({
                priceOverride: z.number().optional().nullable()
            }).optional().nullable()
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

    // 1. Authoritative Server-Side Pricing Calculation
    let total = 0;

    // Extract unique product and bundle IDs
    const productIds = [...new Set(items.map(i => i.productId))];
    const bundleIds = [...new Set(items.map(i => i.bundleId).filter(Boolean))] as string[];

    // Fetch products
    const { data: productsData } = await supabaseAdmin
        .from('products')
        .select('id, base_price')
        .in('id', productIds);

    const productPrices = new Map((productsData || []).map(p => [p.id, p.base_price]));

    // Fetch bundles for overrides and their item definitions to determine bundle quantity
    const { data: bundlesData } = await supabaseAdmin
        .from('bundles')
        .select(`
            id,
            price_override,
            items:bundle_items(product_id, quantity)
        `)
        .in('id', bundleIds);

    const bundleDefinitions = new Map((bundlesData || []).map(b => [b.id, b]));

    // Secure Base Calculation:
    // 1. Validate all products exist.
    for (const item of items) {
        if (!productPrices.has(item.productId)) {
            return { success: false, error: `Invalid product ID: ${item.productId}` };
        }
    }

    // 2. Separate items
    const standaloneItems = items.filter(i => !i.bundleId);
    const bundledItems = items.filter(i => i.bundleId);

    // 3. Charge standalone items at base price
    for (const item of standaloneItems) {
        const basePrice = productPrices.get(item.productId)!;
        total += basePrice * item.quantity;
        item.price = basePrice;
    }

    // 4. Process Bundles securely
    const bundlesGrouped = bundledItems.reduce((acc, item) => {
        if (!acc[item.bundleId!]) acc[item.bundleId!] = [];
        acc[item.bundleId!].push(item);
        return acc;
    }, {} as Record<string, typeof items>);

    for (const [bId, bItems] of Object.entries(bundlesGrouped)) {
        const bundleDef = bundleDefinitions.get(bId);
        const requiredItems = bundleDef?.items || [];
        const override = bundleDef?.price_override;

        // Group the client's submitted bundle items by productId
        const clientQtys = new Map<string, number>();
        for (const item of bItems) {
            clientQtys.set(item.productId, (clientQtys.get(item.productId) || 0) + item.quantity);
        }

        // How many full bundles did the user actually submit?
        let numBundlesPurchased = 0;
        if (requiredItems.length > 0) {
            numBundlesPurchased = Math.min(...requiredItems.map((req: any) => {
                const clientQty = clientQtys.get(req.product_id) || 0;
                return Math.floor(clientQty / req.quantity);
            }));
        }

        // Value of 1 full bundle at standard base prices
        let oneBundleBaseTotal = 0;
        for (const req of requiredItems) {
            oneBundleBaseTotal += (productPrices.get(req.product_id) || 0) * req.quantity;
        }

        // The discounted price for 1 full bundle
        const oneBundleFinalPrice = (override !== undefined && override !== null) ? override : oneBundleBaseTotal;

        // Charge for the full bundles
        total += oneBundleFinalPrice * numBundlesPurchased;

        // Calculate and charge for the remaining "extra/loose" items not covered by the full bundles
        for (const [pId, totalQty] of clientQtys.entries()) {
            const req = requiredItems.find((r: any) => r.product_id === pId);
            const reqQtyPerBundle = req ? req.quantity : 0;
            const bundledQty = reqQtyPerBundle * numBundlesPurchased;
            const looseQty = totalQty - bundledQty;

            if (looseQty > 0) {
                total += (productPrices.get(pId) || 0) * looseQty;
            }
        }

        // Calculate a safe average unit price for the database insert.
        for (const item of bItems) {
            const basePrice = productPrices.get(item.productId)!;
            const req = requiredItems.find((r: any) => r.product_id === item.productId);
            const reqQtyPerBundle = req ? req.quantity : 0;
            const itemBundledQty = Math.min(item.quantity, reqQtyPerBundle * numBundlesPurchased);
            const itemLooseQty = item.quantity - itemBundledQty;

            let lineTotal = 0;
            if (override !== undefined && override !== null && oneBundleBaseTotal > 0) {
                const discountedUnit = basePrice * (override / oneBundleBaseTotal);
                lineTotal = (discountedUnit * itemBundledQty) + (basePrice * itemLooseQty);
            } else {
                lineTotal = basePrice * item.quantity;
            }

            item.price = item.quantity > 0 ? lineTotal / item.quantity : 0;
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
