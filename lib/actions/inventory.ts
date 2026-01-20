'use server';

import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth/session';

const productSchema = z.object({
    name: z.string().min(2),
    name_ar: z.string().optional(),
    description: z.string().min(10),
    description_ar: z.string().optional(),
    base_price: z.coerce.number().min(0),
    category: z.string().min(2),
    images: z.string().optional(), // JSON string of string[]
    sizes: z.string().optional(), // JSON string
});

export async function addProduct(prevState: any, formData: FormData) {
    const session = await verifySession();
    if (session?.role !== 'admin') {
        return { error: 'Unauthorized' };
    }

    const result = productSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        console.error(result.error);
        return { error: 'Invalid inputs: ' + result.error.issues[0].message };
    }

    const { name, name_ar, description, description_ar, base_price, category, sizes } = result.data;

    // Parse images from JSON string
    let parsedImages: string[] = [];
    try {
        if (result.data.images) {
            parsedImages = JSON.parse(result.data.images);
        }
    } catch (e) {
        console.error('Failed to parse images', e);
    }

    let parsedSizes: string[] = [];
    try {
        if (sizes) parsedSizes = JSON.parse(sizes);
    } catch (e) {
        console.error('Failed to parse sizes', e);
    }

    const { error } = await supabase
        .from('products')
        .insert({
            name,
            name_ar,
            description,
            description_ar,
            base_price,
            category,
            images: parsedImages,
            items_in_stock: 10, // Default stock if needed
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
    if (session?.role !== 'admin') {
        return { error: 'Unauthorized' };
    }

    const { error } = await supabase.from('products').delete().eq('id', productId);

    if (error) {
        console.error('Delete Error:', error);
        return { error: 'Failed' };
    }
}

export async function updateProduct(productId: string, prevState: any, formData: FormData) {
    const session = await verifySession();
    if (session?.role !== 'admin') {
        return { error: 'Unauthorized' };
    }

    const result = productSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        console.error(result.error);
        return { error: 'Invalid inputs' };
    }

    const { name, name_ar, description, description_ar, base_price, category, sizes } = result.data;

    // LOGGING FOR DEBUG
    console.log('Update Product ID:', productId);
    console.log('Raw Images Input:', result.data.images);

    // Parse images from JSON string
    let parsedImages: string[] = [];
    try {
        if (result.data.images) {
            parsedImages = JSON.parse(result.data.images);
        }
    } catch (e) {
        console.error('Failed to parse images', e);
    }

    let parsedSizes: string[] = [];
    try {
        if (sizes) parsedSizes = JSON.parse(sizes);
    } catch (e) {
        console.error('Failed to parse sizes', e);
    }

    const { error } = await supabase
        .from('products')
        .update({
            name,
            name_ar,
            description,
            description_ar,
            base_price,
            category,
            images: parsedImages, // Save the array
            sizes: parsedSizes
        })
        .eq('id', productId);

    if (error) {
        console.error('Update Product Error:', error);
        return { error: error.message };
    }

    redirect('/admin/inventory');
}
