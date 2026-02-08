'use server';

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import bcrypt from 'bcryptjs';
import { createSession, deleteSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

const signupSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
});

export async function login(prevState: any, formData: FormData) {
    const result = loginSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        return { error: 'Invalid inputs' };
    }

    const { email, password } = result.data;
    const supabase = await import('@/lib/supabase/server').then(m => m.createClient());

    // 1. Try Supabase Auth Login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (authError) {
        console.warn('Supabase Auth Login Failed:', authError.message);

        // 2. Fallback: Try Legacy Login (Bcrypt check against public.users)
        // This is necessary for existing users who haven't migrated to Supabase Auth yet.
        const adminSupabase = createAdminClient();
        const { data: legacyUser, error: legacyError } = await adminSupabase
            .from('users')
            .select('id, password_hash, role')
            .eq('email', email)
            .single();

        if (legacyError || !legacyUser || !legacyUser.password_hash) {
            return { error: 'Invalid credentials' };
        }

        const isPasswordValid = await bcrypt.compare(password, legacyUser.password_hash);
        if (!isPasswordValid) {
            return { error: 'Invalid credentials' };
        }

        // Legacy login successful -> Create session
        await createSession(legacyUser.id, legacyUser.role);
    } else {
        // Supabase Auth Login Successful
        // Sync session state to our custom cookie for app compatibility
        // We need to fetch the user role from public.users table because auth.users metadata might not be enough
        // or we want consistency.
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', authData.user.id)
            .single();

        await createSession(authData.user.id, profile?.role || 'customer');
    }

    redirect('/');
}

export async function signup(prevState: any, formData: FormData) {
    const result = signupSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        return { error: 'Invalid inputs' };
    }

    const { name, email, password } = result.data;
    const supabase = await import('@/lib/supabase/server').then(m => m.createClient());

    // Check if user already exists in public.users to give better error
    // Although Supabase Auth will also check, explicit check is good for UX
    // Using admin client to bypass RLS for check if needed, but server client is fine for public read usually
    // Actually, let's rely on Supabase Auth error handling for email duplication.

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: name, // This will be used by the trigger to populate public.users
            },
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        },
    });

    if (error) {
        console.error('Signup Error:', error);
        return { error: error.message };
    }

    if (data?.user && data?.user?.identities && data?.user?.identities.length === 0) {
        return { error: 'User already exists' };
    }

    // Return success state for the frontend to show the popup
    return { success: true };
}

export async function logout() {
    // 1. Invalidate Supabase Session
    const supabase = await import('@/lib/supabase/server').then(m => m.createClient());
    await supabase.auth.signOut();

    // 2. Clear Internal Session
    await deleteSession();

    redirect('/');
}

export async function checkAuth() {
    const { getSession } = await import('@/lib/auth/session');
    const session = await getSession(); // Safe, no redirect
    if (session?.userId) {
        return { user: { id: session.userId, role: session.role } };
    }
    return { user: null };
}
