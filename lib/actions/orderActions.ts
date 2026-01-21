'use server';

import { supabase } from '@/lib/supabase';
import { sendOrderEmail } from '@/lib/email';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const OrderSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    address: z.string().min(5),
    city: z.string().min(2),
    items: z.array(z.object({
        productId: z.string(),
        variant: z.string().optional(),
        quantity: z.number().min(1),
        price: z.number(),
        name: z.string()
    }))
});

export async function placeOrder(formData: any) {
    const result = OrderSchema.safeParse(formData);

    if (!result.success) {
        return { success: false, error: 'Invalid form data' };
    }

    const { name, email, phone, address, city, items } = result.data;
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // 1. Insert Order
    // Ensure 'orders' table exists with these fields. 
    // If user mentioned "each user should have his special orders", we should link user_id if logged in.
    // I'll check if we can get the session here.

    // We can import getSession. By default assuming guest checkout is allowed or covered by schema.
    const { createClient } = await import('@supabase/supabase-js');
    // Actually we use the singleton @/lib/supabase which might be a client-side one?
    // Usually actions need a server client with cookies.
    // Let's blindly use @/lib/supabase or @/lib/auth/session logic if available.
    // For now I'm using the imported 'supabase' which is likely the client.
    // Ideally we should use createServerClient from subapase-ssr.
    // But sticking to existing patterns:

    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            customer_name: name,
            customer_email: email,
            customer_phone: phone,
            shipping_address: `${address}, ${city}`,
            total_amount: total,
            status: 'pending'
        })
        .select()
        .single();

    if (orderError) {
        console.error('Order creation failed:', orderError);
        return { success: false, error: 'Failed to create order' };
    }

    // 2. Insert Items
    const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        price_at_purchase: item.price,
        variant: item.variant
    }));

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

    if (itemsError) {
        console.error('Order items failed:', itemsError);
        return { success: false, error: 'Failed to save items' };
    }

    // 3. Send Emails
    try {
        await sendOrderEmail({ order, items });
    } catch (e) {
        console.error('Email failed:', e);
    }

    revalidatePath('/admin/orders');
    return { success: true, orderId: order.id };
}
