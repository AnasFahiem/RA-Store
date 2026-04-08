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
        bundleId: z.string().optional().nullable()
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

    // Securely calculate total by fetching authoritative prices
    let total = 0;
    const standaloneItems = [];
    const bundledItemsByBundleId: Record<string, any[]> = {};

    for (const item of items) {
        if (item.bundleId) {
            if (!bundledItemsByBundleId[item.bundleId]) {
                bundledItemsByBundleId[item.bundleId] = [];
            }
            bundledItemsByBundleId[item.bundleId].push(item);
        } else {
            standaloneItems.push(item);
        }
    }

    // Fetch and calculate standalone items total
    if (standaloneItems.length > 0) {
        const productIds = standaloneItems.map(i => i.productId);
        const { data: products } = await supabaseAdmin.from('products').select('id, base_price').in('id', productIds);
        const priceMap = new Map((products || []).map(p => [p.id, p.base_price]));

        for (const item of standaloneItems) {
            const authoritativePrice = priceMap.get(item.productId);
            if (authoritativePrice === undefined) {
                return { success: false, error: `Product not found: ${item.productId}` };
            }
            total += authoritativePrice * item.quantity;
            item.price = authoritativePrice; // Update to authoritative price for the order record
        }
    }

    // Fetch and calculate bundled items total
    const bundleIds = Object.keys(bundledItemsByBundleId);
    if (bundleIds.length > 0) {
        const { data: bundles } = await supabaseAdmin.from('bundles').select('id, price_override').in('id', bundleIds);
        const bundleMap = new Map((bundles || []).map(b => [b.id, b.price_override]));

        // We also need product base prices to assign proportional prices to items in the order record,
        // or just calculate the total and leave item prices as 0 or proportional.
        // For simplicity and security, we calculate bundle quantity and charge remaining items at base price.
        for (const [bundleId, bundleItems] of Object.entries(bundledItemsByBundleId)) {
            const bundlePrice = bundleMap.get(bundleId);
            if (bundlePrice === undefined || bundlePrice === null) {
                // Fallback to sum of base prices if bundle has no override or not found
                const productIds = bundleItems.map(i => i.productId);
                const { data: products } = await supabaseAdmin.from('products').select('id, base_price').in('id', productIds);
                const priceMap = new Map((products || []).map(p => [p.id, p.base_price]));

                for (const item of bundleItems) {
                    const authoritativePrice = priceMap.get(item.productId) || 0;
                    total += authoritativePrice * item.quantity;
                    item.price = authoritativePrice;
                }
            } else {
                // Calculate how many bundles were purchased
                const { data: bundleDefinitions } = await supabaseAdmin.from('bundle_items').select('product_id, quantity').eq('bundle_id', bundleId);

                if (!bundleDefinitions || bundleDefinitions.length === 0) {
                     // Invalid bundle definition, fallback to standard pricing
                     const productIds = bundleItems.map(i => i.productId);
                     const { data: products } = await supabaseAdmin.from('products').select('id, base_price').in('id', productIds);
                     const priceMap = new Map((products || []).map(p => [p.id, p.base_price]));
                     for (const item of bundleItems) {
                         const authoritativePrice = priceMap.get(item.productId) || 0;
                         total += authoritativePrice * item.quantity;
                         item.price = authoritativePrice;
                     }
                     continue;
                }

                // Group user items by productId
                const userItemQuantities = new Map();
                for (const item of bundleItems) {
                    userItemQuantities.set(item.productId, (userItemQuantities.get(item.productId) || 0) + item.quantity);
                }

                // Calculate minimum bundle ratio
                let bundleCount = Infinity;
                for (const def of bundleDefinitions) {
                    const userQty = userItemQuantities.get(def.product_id) || 0;
                    const ratio = Math.floor(userQty / def.quantity);
                    if (ratio < bundleCount) {
                        bundleCount = ratio;
                    }
                }

                if (bundleCount === Infinity || bundleCount === 0) {
                     bundleCount = 0;
                }

                total += bundleCount * bundlePrice;

                // Calculate leftover items that don't fit into the bundle
                const productIds = Array.from(userItemQuantities.keys());
                const { data: products } = await supabaseAdmin.from('products').select('id, base_price').in('id', productIds);
                const priceMap = new Map((products || []).map(p => [p.id, p.base_price]));

                for (const [productId, userQty] of userItemQuantities.entries()) {
                    const def = bundleDefinitions.find(d => d.product_id === productId);
                    const requiredQty = def ? def.quantity * bundleCount : 0;
                    const leftoverQty = userQty - requiredQty;

                    const authoritativePrice = priceMap.get(productId) || 0;

                    if (leftoverQty > 0) {
                        total += leftoverQty * authoritativePrice;
                    }
                }

                // Assign base price to original items for the order record
                for (const item of bundleItems) {
                    item.price = priceMap.get(item.productId) || 0;
                }
            }
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
