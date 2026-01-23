'use server';

import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';

const productSchema = z.object({
    name: z.string().min(2),
    name_ar: z.string().optional(),
    description: z.string().min(10),
    description_ar: z.string().optional(),
    base_price: z.coerce.number().min(0),
    category: z.string().min(2),
    images: z.string().optional(),
    sizes: z.string().optional(),
});

export async function addProduct(prevState: any, formData: FormData) {
    const session = await verifySession();

    const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.userId)
        .single();

    if (user?.role !== 'admin' && user?.role !== 'owner') {
        return { error: 'Unauthorized' };
    }

    const result = productSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        console.error(result.error);
        return { error: 'Invalid inputs: ' + result.error.issues[0].message };
    }

    const { name, name_ar, description, description_ar, base_price, category, sizes } = result.data;

    let parsedImages: string[] = [];
    try {
        if (result.data.images) {
            const parsed = JSON.parse(result.data.images);
            if (Array.isArray(parsed)) parsedImages = parsed;
        }
    } catch (e) {
        console.error('Failed to parse images', e);
    }

    let parsedSizes: string[] = [];
    try {
        if (sizes) {
            const parsed = JSON.parse(sizes);
            if (Array.isArray(parsed)) parsedSizes = parsed;
        }
    } catch (e) {
        console.error('Failed to parse sizes', e);
    }

    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin
        .from('products')
        .insert({
            name,
            name_ar,
            description,
            description_ar,
            base_price,
            category,
            images: parsedImages,
            items_in_stock: 10,
            sizes: parsedSizes
        });

    if (error) {
        console.error('Add Product Error:', error);
        return { error: error.message };
    }

    redirect('/admin/inventory');
}

export async function deleteProduct(productId: string) {
    const session = await verifySession();

    const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.userId)
        .single();

    if (user?.role !== 'admin' && user?.role !== 'owner') {
        return { error: 'Unauthorized' };
    }

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.from('products').delete().eq('id', productId);

    if (error) {
        console.error('Delete Error:', error);
        return { error: 'Failed' };
    }
}

export async function updateProduct(productId: string, prevState: any, formData: FormData) {
    const session = await verifySession();

    const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.userId)
        .single();

    if (user?.role !== 'admin' && user?.role !== 'owner') {
        return { error: 'Unauthorized' };
    }

    console.log('[updateProduct] Product ID:', productId);

    const result = productSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        console.error('[updateProduct] Validation Failed:', result.error);
        return { error: 'Invalid inputs: ' + result.error.issues.map((i: any) => i.message).join(', ') };
    }

    const { name, name_ar, description, description_ar, base_price, category, sizes } = result.data;

    let parsedImages: string[] = [];
    try {
        if (result.data.images) {
            const parsed = JSON.parse(result.data.images);
            if (Array.isArray(parsed)) parsedImages = parsed;
        }
    } catch (e) {
        console.error('[updateProduct] Failed to parse images', e);
    }

    let parsedSizes: string[] = [];
    try {
        if (sizes) {
            const parsed = JSON.parse(sizes);
            if (Array.isArray(parsed)) parsedSizes = parsed;
        }
    } catch (e) {
        console.error('[updateProduct] Failed to parse sizes', e);
    }

    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
        .from('products')
        .update({
            name,
            name_ar,
            description,
            description_ar,
            base_price,
            category,
            images: parsedImages,
            sizes: parsedSizes
        })
        .eq('id', productId);

    if (error) {
        console.error('[updateProduct] DB Update Error:', error);
        return { error: error.message };
    }

    redirect('/admin/inventory');
}
