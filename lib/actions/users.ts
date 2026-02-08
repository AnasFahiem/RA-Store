'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { verifySession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

export async function getUsers() {
    const session = await verifySession();
    if (session.role !== 'admin' && session.role !== 'owner') {
        throw new Error('Unauthorized');
    }

    const supabase = createAdminClient();

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, role, created_at')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return users;
}

export async function updateUserRole(userId: string, newRole: 'customer' | 'admin') {
    const session = await verifySession();
    if (session.role !== 'owner') {
        throw new Error('Unauthorized');
    }

    const supabase = createAdminClient();

    const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

    if (error) throw error;
    revalidatePath('/admin/users');
}

export async function deleteUser(userId: string) {
    const session = await verifySession();
    if (session.role !== 'owner') {
        throw new Error('Unauthorized');
    }

    const supabase = createAdminClient();

    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
        console.error('Error deleting user from Supabase Auth:', authError);
        // We continue to delete from public.users even if auth deletion fails (or if user wasn't in list), 
        // but typically you want both. For now, we log and proceed.
    }

    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

    if (error) throw error;
    revalidatePath('/admin/users');
}
