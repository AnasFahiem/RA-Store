'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { verifySession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export async function updateOrderStatus(orderId: string, newStatus: string) {
    const session = await verifySession();
    if (session?.role !== 'admin') {
        return { error: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

    if (error) {
        console.error('Update Order Error:', error);
        return { error: 'Failed to update status' };
    }

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/orders');
    return { success: true };
}
