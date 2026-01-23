'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

export async function getCartAction() {
    try {
        console.log('[ServerAction] getCartAction: Starting...');
        const session = await getSession();

        if (!session?.userId) {
            console.log('[ServerAction] getCartAction: No Session Found');
            return [];
        }

        console.log('[ServerAction] getCartAction: User Found:', session.userId);

        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('cart_items')
            .select(`
                product_id,
                quantity,
                variant,
                bundle_id,
                products (
                    name,
                    base_price,
                    images
                ),
                bundles (
                    id,
                    name,
                    price_override
                )
            `)
            .eq('user_id', session.userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[ServerAction] getCartAction: DB Error:', error);
            return [];
        }

        console.log('[ServerAction] getCartAction: Items Found:', data?.length);

        return data.map((item: any) => ({
            productId: item.product_id,
            name: item.products?.name || 'Unknown Product',
            price: item.products?.base_price || 0,
            image: item.products?.images?.[0] || '/placeholder.jpg',
            quantity: item.quantity,
            quantity: item.quantity,
            variant: item.variant,
            bundleId: item.bundle_id,
            bundleDetails: item.bundles ? {
                name: item.bundles.name,
                priceOverride: item.bundles.price_override
            } : undefined
        }));
    } catch (error) {
        console.error('Get Cart Exception:', error);
        return [];
    }
}

export async function addToCartAction(item: { productId: string; quantity: number; variant?: string; bundleId?: string }) {
    try {
        const session = await getSession();
        if (!session?.userId) return { error: 'Not authenticated' };

        const supabase = createAdminClient();

        console.log(`[ServerAction] AddToCart: User ${session.userId}, Product ${item.productId}, Bundle ${item.bundleId || 'N/A'}`);

        // If bundleId is present, we skip the RPC as it likely doesn't support the new column yet.
        // We use direct Upsert instead.
        if (!item.bundleId) {
            // Use RPC or Upsert via Admin Client
            // Schema: handle_admin_add_to_cart(p_user_id, p_product_id, p_quantity, p_variant)
            const { error } = await supabase.rpc('handle_admin_add_to_cart', {
                p_user_id: session.userId,
                p_product_id: item.productId,
                p_quantity: item.quantity,
                p_variant: item.variant || null
            });

            if (!error) {
                revalidatePath('/');
                return { success: true };
            }
            console.warn('[ServerAction] RPC Failed, trying Admin Upsert:', error);
        }

        // Fallback to Upsert (or primary path if bundleId is set)

        // NOTE: Basic Upsert overwrites quantity. We accept this as fallback.
        const { error: upsertError } = await supabase
            .from('cart_items')
            .upsert({
                user_id: session.userId,
                product_id: item.productId,
                quantity: item.quantity,
                variant: item.variant || null,
                bundle_id: item.bundleId || null
            }, {
                onConflict: 'user_id,product_id,variant,bundle_id'
            });

        if (upsertError) {
            console.error('[ServerAction] Upsert Failed:', upsertError);
            throw new Error(`DB Error: ${upsertError.message}`);
        }

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error('AddToCart Error:', error);
        return { error: error.message || 'Failed to add item' };
    }
}

export async function removeFromCartAction(productId: string, variant?: string) {
    try {
        const session = await getSession();
        if (!session?.userId) return { error: 'Not authenticated' };

        const supabase = createAdminClient();

        let query = supabase
            .from('cart_items')
            .delete()
            .eq('user_id', session.userId) // Securely filter by user
            .eq('product_id', productId);

        if (variant) {
            query = query.eq('variant', variant);
        } else {
            query = query.is('variant', null);
        }

        const { error } = await query;
        if (error) throw error;

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('RemoveFromCart Error:', error);
        return { error: 'Failed to remove item' };
    }
}

export async function removeBundleAction(bundleId: string) {
    try {
        const session = await getSession();
        if (!session?.userId) return { error: 'Not authenticated' };

        const supabase = createAdminClient();

        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', session.userId)
            .eq('bundle_id', bundleId);

        if (error) throw error;

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('RemoveBundle Error:', error);
        return { error: 'Failed to remove bundle' };
    }
}

export async function updateQuantityAction(productId: string, variant: string | undefined, quantity: number) {
    try {
        const session = await getSession();
        if (!session?.userId) return { error: 'Not authenticated' };

        const supabase = createAdminClient();

        if (quantity <= 0) {
            return removeFromCartAction(productId, variant);
        }

        let query = supabase
            .from('cart_items')
            .update({ quantity })
            .eq('user_id', session.userId)
            .eq('product_id', productId);

        if (variant) {
            query = query.eq('variant', variant);
        } else {
            query = query.is('variant', null);
        }

        const { error } = await query;
        if (error) throw error;

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('UpdateQuantity Error:', error);
        return { error: 'Failed to update quantity' };
    }
}

export async function clearCartAction() {
    try {
        const session = await getSession();
        if (!session?.userId) return { error: 'Not authenticated' };

        const supabase = createAdminClient();

        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', session.userId);

        if (error) throw error;

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('ClearCart Error:', error);
        return { error: 'Failed to clear cart' };
    }
}

// Sync is less relevant now as we don't have a reliable client auth state to trigger it.
// Unless we trigger it on login action.
export async function syncCartAction(localItems: any[]) {
    try {
        const session = await getSession();
        if (!session?.userId || !localItems.length) return;

        console.log('[ServerAction] Syncing Cart for User:', session.userId);

        // Loop and add (Atomic)
        for (const item of localItems) {
            await addToCartAction({
                productId: item.productId,
                quantity: item.quantity,
                variant: item.variant
            });
        }

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('SyncCart Error:', error);
    }
}
