'use server';

import { productSchema } from '@/lib/validations/products';
import { ProductService } from '@/services/products';
import { verifySession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function addProduct(prevState: any, formData: FormData) {
    const session = await verifySession();

    // Authorization Check
    const supabase = await createClient();
    const { data: user } = await supabase.from('users').select('role').eq('id', session.userId).single();
    if (user?.role !== 'admin' && user?.role !== 'owner') {
        return { error: 'Unauthorized' };
    }

    const result = productSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
        return { error: 'Invalid inputs: ' + result.error.issues[0].message };
    }

    try {
        await ProductService.createProduct(result.data);
    } catch (error: any) {
        console.error('Add Product Error:', error);
        return { error: error.message };
    }

    redirect('/admin/inventory');
}

export async function deleteProduct(productId: string) {
    const session = await verifySession();

    // Authorization Check
    const supabase = await createClient();
    const { data: user } = await supabase.from('users').select('role').eq('id', session.userId).single();
    if (user?.role !== 'admin' && user?.role !== 'owner') return { error: 'Unauthorized' };

    try {
        await ProductService.deleteProduct(productId);
    } catch (error) {
        console.error('Delete Error:', error);
        return { error: 'Failed' };
    }
}

export async function updateProduct(productId: string, prevState: any, formData: FormData) {
    const session = await verifySession();

    // Authorization Check
    const supabase = await createClient();
    const { data: user } = await supabase.from('users').select('role').eq('id', session.userId).single();
    if (user?.role !== 'admin' && user?.role !== 'owner') return { error: 'Unauthorized' };

    const result = productSchema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
        return { error: 'Invalid inputs: ' + result.error.issues.map((i: any) => i.message).join(', ') };
    }

    try {
        await ProductService.updateProduct(productId, result.data);
    } catch (error: any) {
        console.error('[updateProduct] Error:', error);
        return { error: error.message };
    }

    redirect('/admin/inventory');
}
