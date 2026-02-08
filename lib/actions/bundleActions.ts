'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import { z } from 'zod';
import { unstable_noStore as noStore } from 'next/cache';

// --- Schemas ---
const BundleSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    type: z.enum(['admin_fixed', 'user_custom']),
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().min(1)
    })),
    priceOverride: z.number().optional(),
    image: z.string().optional().nullable()
});

const DiscountRuleSchema = z.object({
    name: z.string().min(1),
    minQuantity: z.number().min(1),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().min(0),
    requiredCategory: z.string().optional().nullable(),
    isActive: z.boolean().default(true)
});

const PromoCodeSchema = z.object({
    code: z.string().min(3).max(20).transform(val => val.toUpperCase()),
    description: z.string().optional(),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().min(0),
    maxUses: z.number().min(0).optional().nullable(),
    expiresAt: z.string().optional().nullable(),
    isActive: z.boolean().default(true)
});

// --- Actions ---

export async function getDiscountRules() {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
        .from('discount_rules')
        .select('*')
        .eq('is_active', true)
        .order('min_quantity', { ascending: true });

    if (error) {
        console.error('getDiscountRules error:', error);
        return [];
    }
    return data || [];
}

export async function getDiscountRuleById(id: string) {
    noStore();
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
        .from('discount_rules')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('getDiscountRuleById error:', error);
        return null;
    }
    return data;
}

export async function getAdminBundles() {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
        .from('bundles')
        .select(`
      *,
      items:bundle_items(
        quantity,
        product:products(*)
      )
    `)
        .eq('type', 'admin_fixed')
        .eq('is_active', true);

    if (error) {
        console.error('getAdminBundles error:', error);
        return [];
    }
    return data || [];
}

export async function createBundle(formData: any) {
    const session = await getSession();
    const result = BundleSchema.safeParse(formData);

    if (!result.success) {
        return { success: false, error: 'Invalid data' };
    }

    const { name, description, type, items, priceOverride } = result.data;
    const slug = name.toLowerCase().replaceAll(' ', '-') + '-' + Date.now();

    const supabaseAdmin = createAdminClient();

    const { data: bundle, error: bundleError } = await supabaseAdmin
        .from('bundles')
        .insert({
            name,
            description,
            slug,
            type,
            image: result.data.image,
            price_override: priceOverride,
            created_by: session?.userId || null
        })
        .select()
        .single();

    if (bundleError) {
        console.error('createBundle error:', bundleError);
        return { success: false, error: 'Failed to create bundle' };
    }

    if (items.length > 0) {
        const bundleItems = items.map((item: any) => ({
            bundle_id: bundle.id,
            product_id: item.productId,
            quantity: item.quantity
        }));

        const { error: itemsError } = await supabaseAdmin
            .from('bundle_items')
            .insert(bundleItems);

        if (itemsError) {
            console.error('createBundle items error:', itemsError);
            return { success: false, error: 'Failed to add items to bundle' };
        }
    }

    revalidatePath('/bundler');
    revalidatePath('/admin/bundles');
    return { success: true, bundleId: bundle.id };
}

export async function deleteBundle(bundleId: string) {
    const session = await getSession();
    if (session?.role !== 'admin' && session?.role !== 'owner') {
        return { success: false, error: 'Unauthorized' };
    }

    // First delete bundle items
    const supabaseAdmin = createAdminClient();
    await supabaseAdmin
        .from('bundle_items')
        .delete()
        .eq('bundle_id', bundleId);

    // Then delete bundle
    const { error } = await supabaseAdmin
        .from('bundles')
        .delete()
        .eq('id', bundleId);

    if (error) {
        console.error('deleteBundle error:', error);
        return { success: false, error: 'Failed to delete bundle' };
    }

    revalidatePath('/admin/bundles');
    revalidatePath('/bundler');
    return { success: true };
}

export async function updateBundle(bundleId: string, formData: any) {
    const session = await getSession();
    if (session?.role !== 'admin' && session?.role !== 'owner') {
        return { success: false, error: 'Unauthorized' };
    }

    const result = BundleSchema.safeParse(formData);
    if (!result.success) {
        return { success: false, error: 'Invalid data' };
    }

    const { name, description, items, priceOverride } = result.data;

    const supabaseAdmin = createAdminClient();

    // Update bundle
    const { error: bundleError } = await supabaseAdmin
        .from('bundles')
        .update({
            name,
            description,
            image: result.data.image,
            price_override: priceOverride
        })
        .eq('id', bundleId);

    if (bundleError) {
        console.error('updateBundle error:', bundleError);
        return { success: false, error: 'Failed to update bundle' };
    }

    // Delete old items and insert new ones
    await supabaseAdmin
        .from('bundle_items')
        .delete()
        .eq('bundle_id', bundleId);

    if (items.length > 0) {
        const bundleItems = items.map((item: any) => ({
            bundle_id: bundleId,
            product_id: item.productId,
            quantity: item.quantity
        }));

        const { error: itemsError } = await supabaseAdmin
            .from('bundle_items')
            .insert(bundleItems);

        if (itemsError) {
            console.error('updateBundle items error:', itemsError);
            return { success: false, error: 'Failed to update bundle items' };
        }
    }

    revalidatePath('/bundler');
    revalidatePath('/admin/bundles');
    return { success: true };
}

export async function createDiscountRule(formData: any) {
    const session = await getSession();
    if (session?.role !== 'admin' && session?.role !== 'owner') {
        return { success: false, error: 'Unauthorized' };
    }

    const result = DiscountRuleSchema.safeParse(formData);
    if (!result.success) return { success: false, error: 'Invalid data' };

    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin
        .from('discount_rules')
        .insert({
            name: result.data.name,
            min_quantity: result.data.minQuantity,
            discount_type: result.data.discountType,
            discount_value: result.data.discountValue,
            required_category: result.data.requiredCategory,
            is_active: result.data.isActive
        });

    if (error) {
        console.error('createDiscountRule error:', error);
        return { success: false, error: 'Failed to create rule' };
    }

    revalidatePath('/admin/bundles');
    return { success: true };
}

// Special function to add a whole bundle to the cart
export async function getBundleById(id: string) {
    console.log('[getBundleById] querying ID:', id);
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
        .from('bundles')
        .select(`
            *,
            items:bundle_items(
                quantity,
                product:products(*)
            )
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('[getBundleById] Error:', error);
        return null; // This triggers notFound()
    }
    return data;
}

export async function addBundleToCart(bundleId: string) {
    console.log('[addBundleToCart] Starting for Bundle:', bundleId);
    const session = await getSession();
    let userId = session?.userId;
    console.log('[addBundleToCart] User:', userId);

    const supabaseAdmin = createAdminClient();

    // Fetch bundle items
    const { data: bundleItems, error: fetchError } = await supabaseAdmin
        .from('bundle_items')
        .select('product_id, quantity')
        .eq('bundle_id', bundleId);

    if (fetchError || !bundleItems) {
        console.error('[addBundleToCart] Bundle Fetch Error:', fetchError);
        return { success: false, error: 'Bundle not found' };
    }

    if (!userId) {
        return { success: false, error: 'Please login to add bundles' };
    }

    // 1. Check for existing items from this bundle in the cart
    const { data: existingItems } = await supabaseAdmin
        .from('cart_items')
        .select('product_id, quantity, variant')
        .eq('user_id', userId)
        .eq('bundle_id', bundleId);

    const inputs = bundleItems.map((item: any) => {
        // Find if this product is already in cart for this bundle
        // (Assuming variant is null for bundles for now, as we don't have variant selection in bundle builder yet)
        const existing = existingItems?.find(e => e.product_id === item.product_id);
        const currentQty = existing ? existing.quantity : 0;

        return {
            user_id: userId,
            product_id: item.product_id,
            quantity: currentQty + item.quantity, // Increment
            bundle_id: bundleId,
            variant: null // Default null variant
        };
    });

    // 2. Upsert items (using user_id + product_id + bundle_id + variant uniqueness)
    // Since we now have a unique index on (user_id, product_id, variant, bundle_id), 
    // we must ensure 'upsert' can match it.
    // However, with partial indexes, onConflict might be tricky.
    // Safe approach: Delete these specific items rows and re-insert? 
    // No, that loses "created_at".
    // Better: Try upsert without onConflict (letting PK handle it if exists?) No PK is generic ID.
    // We will use explicit conflict columns which match the index definition.

    // Note: We need to pass the constraint name or columns.
    // Since `variant` is nullable, we rely on the index behavior.

    const { error: upsertError } = await supabaseAdmin
        .from('cart_items')
        .upsert(inputs, {
            onConflict: 'user_id,product_id,variant,bundle_id',
            // ignoreDuplicates: false
        });

    if (upsertError) {
        console.error('addBundleToCart upsert error:', upsertError);
        // Fallback: Delete and Insert (Brute force but reliable)
        console.log('Falling back to Delete+Insert strategy...');

        await supabaseAdmin.from('cart_items').delete()
            .eq('user_id', userId!)
            .eq('bundle_id', bundleId);

        const { error: retryError } = await supabaseAdmin
            .from('cart_items')
            .insert(inputs); // inputs have incremented quantity

        if (retryError) {
            console.error('addBundleToCart retry error:', retryError);
            return { success: false, error: 'Failed to add bundle to cart' };
        }
    }

    revalidatePath('/cart');
    revalidatePath('/');
    return { success: true };
}

// --- Discount Rules Actions ---

export async function updateDiscountRule(id: string, formData: any) {
    const session = await getSession();
    if (session?.role !== 'admin' && session?.role !== 'owner') {
        return { success: false, error: 'Unauthorized' };
    }

    const result = DiscountRuleSchema.safeParse(formData);
    if (!result.success) return { success: false, error: 'Invalid data' };

    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin
        .from('discount_rules')
        .update({
            name: result.data.name,
            min_quantity: result.data.minQuantity,
            discount_type: result.data.discountType,
            discount_value: result.data.discountValue,
            required_category: result.data.requiredCategory,
            is_active: result.data.isActive
        })
        .eq('id', id);

    if (error) {
        console.error('updateDiscountRule error:', error);
        return { success: false, error: 'Failed to update rule' };
    }

    revalidatePath('/admin/bundles');
    return { success: true };
}

export async function deleteDiscountRule(id: string) {
    const session = await getSession();
    if (session?.role !== 'admin' && session?.role !== 'owner') {
        return { success: false, error: 'Unauthorized' };
    }

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
        .from('discount_rules')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('deleteDiscountRule error:', error);
        return { success: false, error: 'Failed to delete rule' };
    }

    revalidatePath('/admin/bundles');
    return { success: true };
}

// --- Promo Code Actions ---

export async function getPromoCodes() {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('getPromoCodes error:', error);
        return [];
    }
    return data || [];
}

export async function getPromoCodeById(id: string) {
    noStore();
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
        .from('promo_codes')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('getPromoCodeById error:', error);
        return null;
    }
    return data;
}

export async function createPromoCode(formData: any) {
    const session = await getSession();
    if (session?.role !== 'admin' && session?.role !== 'owner') {
        return { success: false, error: 'Unauthorized' };
    }

    const result = PromoCodeSchema.safeParse(formData);
    if (!result.success) return { success: false, error: 'Invalid data' };

    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin
        .from('promo_codes')
        .insert({
            code: result.data.code,
            description: result.data.description,
            discount_type: result.data.discountType,
            discount_value: result.data.discountValue,
            max_uses: result.data.maxUses,
            expires_at: result.data.expiresAt, // Expecting ISO string or null
            is_active: result.data.isActive
        });

    if (error) {
        console.error('createPromoCode error:', error);
        return { success: false, error: 'Failed to create promo code: ' + error.message };
    }

    revalidatePath('/admin/bundles');
    return { success: true };
}

export async function updatePromoCode(id: string, formData: any) {
    const session = await getSession();
    if (session?.role !== 'admin' && session?.role !== 'owner') {
        return { success: false, error: 'Unauthorized' };
    }

    const result = PromoCodeSchema.safeParse(formData);
    if (!result.success) return { success: false, error: 'Invalid data' };

    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin
        .from('promo_codes')
        .update({
            code: result.data.code,
            description: result.data.description,
            discount_type: result.data.discountType,
            discount_value: result.data.discountValue,
            max_uses: result.data.maxUses,
            expires_at: result.data.expiresAt,
            is_active: result.data.isActive
        })
        .eq('id', id);

    if (error) {
        console.error('updatePromoCode error:', error);
        return { success: false, error: 'Failed to update promo code' };
    }

    revalidatePath('/admin/bundles');
    return { success: true };
}

export async function deletePromoCode(id: string) {
    const session = await getSession();
    if (session?.role !== 'admin' && session?.role !== 'owner') {
        return { success: false, error: 'Unauthorized' };
    }

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
        .from('promo_codes')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('deletePromoCode error:', error);
        return { success: false, error: 'Failed to delete promo code' };
    }

    revalidatePath('/admin/bundles');
    return { success: true };
}

export async function validatePromoCode(code: string) {
    const supabaseAdmin = createAdminClient();

    // checks: exists, active, not expired, max uses not reached
    const { data: promo, error } = await supabaseAdmin
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

    if (error || !promo) {
        return { valid: false, error: 'Invalid code' };
    }

    // Check expiration
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        return { valid: false, error: 'Code expired' };
    }

    // Check usage limit
    if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
        return { valid: false, error: 'Code usage limit reached' };
    }

    return {
        valid: true,
        promo: {
            code: promo.code,
            type: promo.discount_type,
            value: promo.discount_value,
            id: promo.id
        }
    };
}
