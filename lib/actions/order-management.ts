'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { verifySession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

import { sendStatusUpdateEmail } from '@/lib/email';

export async function updateOrderStatus(orderId: string, newStatus: string) {
    const session = await verifySession();
    if (session?.role !== 'admin' && session?.role !== 'owner') {
        return { error: 'Unauthorized' };
    }

    const { data: updatedOrder, error } = await createAdminClient()
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .select()
        .single();

    if (error) {
        console.error('Update Order Error:', error);
        return { error: 'Failed to update status' };
    }

    // Send email notification
    if (updatedOrder) {
        // Run in background to not block response
        sendStatusUpdateEmail({ order: updatedOrder, newStatus }).catch(e =>
            console.error('Failed to send status update email:', e)
        );
    }

    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath('/admin/orders');
    return { success: true };
}
