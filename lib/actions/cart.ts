'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type CartItem = {
    productId: string;
    variant?: string; // Size
    quantity: number;
};

export async function getCart() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('cart_items')
        .select(`
            product_id,
            quantity,
            variant,
            products (
                name,
                base_price,
                images
            )
        `)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error fetching cart:', error);
        return [];
    }

    // Map to CartContext structure
    return data.map((item: any) => ({
        productId: item.product_id,
        name: item.products.name,
        price: item.products.base_price,
        image: item.products.images?.[0] || '/placeholder.jpg',
        quantity: item.quantity,
        variant: item.variant,
    }));
}

export async function addToCartAction(item: CartItem) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Not authenticated' };

    // Check if item exists to update quantity, or simple upsert?
    // Unique constraint logic: UNIQUE(user_id, product_id, variant)
    // We can use UPSERT logic. But standard upsert in Supabase (Postgrest) requires ignoring duplicate key, 
    // but here we want to increment quantity if exists.
    // Easier to fetch first or write a specific SQL function.
    // Let's use basic check-then-update logic for now or ON CONFLICT UPDATE if we can constructing data right.

    // Actually, SQL `ON CONFLICT` is best. 
    // Supabase JS .upsert() handles this if we define the conflict columns.

    // BUT we want to *increment* quantity, not just replace it?
    // Client usually sends "new" total quantity? No, usually +1.
    // Context sends `item`. Context `addToCart` calculates new total locally.
    // IF we trust client to send the FINAL quantity, upsert is fine.
    // IF we act like "add 1", we need logic.
    // The `CartContext` `addToCart` calculates `existing.quantity + newItem.quantity`. 
    // So the client knows the intended TOTAL.
    // So we can just UPSERT the `item.quantity` passed from client logic (after client calculation).

    // Wait, the action `addToCartAction` might be called with just the delta? 
    // No, let's design `syncCartItem` essentially.

    const { error } = await supabase
        .from('cart_items')
        .upsert({
            user_id: user.id,
            product_id: item.productId,
            variant: item.variant || null,
            quantity: item.quantity
        }, {
            onConflict: 'user_id,product_id,variant'
        });

    if (error) {
        console.error('Error adding to cart:', error);
        return { error: error.message };
    }

    revalidatePath('/'); // or specific paths
    return { success: true };
}

export async function removeFromCartAction(productId: string, variant?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    let query = supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

    if (variant) {
        query = query.eq('variant', variant);
    } else {
        query = query.is('variant', null);
    }

    await query;
    revalidatePath('/');
}

export async function updateQuantityAction(productId: string, variant: string | undefined, quantity: number) {
    // Same as addToCart really, just explicit update
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    if (quantity <= 0) {
        // Should remove
        return removeFromCartAction(productId, variant);
    }

    const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('variant', variant || null) // Handle null variant
    // .is('variant', null) logic is tricky in update if variant is undefined.
    // We need conditional builder or explicit null check.

    // Supabase .eq() with null works as IS NULL in some versions, but better be safe.
    // Actually, upsert is safer if we have the ID. But we don't.

    // Let's refine the query construction
    let query = supabase.from('cart_items').update({ quantity }).eq('user_id', user.id).eq('product_id', productId);

    if (variant) {
        query = query.eq('variant', variant);
    } else {
        query = query.is('variant', null);
    }

    await query;
    revalidatePath('/');
}

export async function syncCartAction(localItems: any[]) {
    // Called on login to merge local items
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    // We loop through local items and upsert them.
    // To avoid "overwrite" if DB has higher quantity? 
    // Simple logic: Local wins or DB+Local? 
    // Usually "Merge" means Sum.
    // But complexity...
    // Let's just Upsert local items, overwriting DB for those specific items, or adding them.
    // Actually, best UX: if DB has it, add quantities.

    for (const item of localItems) {
        // Fetch existing
        const { data: existing } = await supabase
            .from('cart_items')
            .select('quantity')
            .eq('user_id', user.id)
            .eq('product_id', item.productId)
            .filter('variant', item.variant ? 'eq' : 'is', item.variant || null)
            .single();

        const newQty = (existing?.quantity || 0) + item.quantity;

        await supabase.from('cart_items').upsert({
            user_id: user.id,
            product_id: item.productId,
            variant: item.variant || null,
            quantity: newQty
        }, { onConflict: 'user_id,product_id,variant' });
    }

    revalidatePath('/');
    return { success: true };
}
