'use server';

import { createClient } from '@/lib/supabase/server';
import { verifySession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

export async function getUsers() {
    const session = await verifySession();
    if (session.role !== 'admin' && session.role !== 'owner') {
        throw new Error('Unauthorized');
    }

    const supabase = await createClient();

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

    const supabase = await createClient();

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

    const supabase = await createClient();

    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

    if (error) throw error;
    revalidatePath('/admin/users');
}
