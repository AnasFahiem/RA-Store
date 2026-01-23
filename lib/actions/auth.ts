'use server';

import { z } from 'zod';
import { supabase } from '@/lib/supabase';
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

    // Fetch user from Supabase
    const { data: user, error } = await supabase
        .from('users')
        .select('id, email, password_hash, role')
        .eq('email', email)
        .single();

    if (error || !user) {
        console.error('Login Error:', error);
        return { error: 'Invalid credentials' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
        return { error: 'Invalid credentials' };
    }

    await createSession(user.id, user.role);

    redirect('/');
}

export async function signup(prevState: any, formData: FormData) {
    const result = signupSchema.safeParse(Object.fromEntries(formData));

    if (!result.success) {
        return { error: 'Invalid inputs' };
    }

    const { name, email, password } = result.data;

    // Check existing user
    const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();

    if (existingUser) {
        return { error: 'User already exists' };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Insert new user
    const { data: user, error } = await supabase
        .from('users')
        .insert({
            name,
            email,
            password_hash: passwordHash,
            role: 'customer'
        })
        .select()
        .single();

    if (error || !user) {
        console.error('Signup Error:', error);
        return { error: 'Failed to create user' };
    }

    await createSession(user.id, 'customer');
    redirect('/');
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
