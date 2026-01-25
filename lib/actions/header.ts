'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export interface HeaderSlide {
    id: string;
    content: string;
    content_ar: string | null;
    active: boolean;
    sort_order: number;
    background_color?: string | null;
    text_color?: string | null;
}

export interface HeaderSettings {
    id: number;
    background_color: string;
    text_color: string;
    height: number;
    is_active: boolean;
    animation: 'marquee' | 'fade';
}

export async function getHeaderSlides() {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
        .from('header_slides')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Error fetching header slides:', error);
        return [];
    }

    return data as HeaderSlide[];
}

export async function getAllHeaderSlides() {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
        .from('header_slides')
        .select('*')
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Error fetching all header slides:', error);
        return [];
    }

    return data as HeaderSlide[];
}

export async function getHeaderSettings() {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
        .from('header_settings')
        .select('*')
        .single();

    if (error) {
        // If it doesn't exist, return default
        if (error.code === 'PGRST116') {
            return {
                id: 1,
                background_color: '#5B21B6',
                text_color: '#FFFFFF',
                height: 40,
                is_active: true,
                animation: 'marquee'
            } as HeaderSettings;
        }
        console.error('Error fetching header settings:', error);
        return null;
    }

    return data as HeaderSettings;
}

export async function addHeaderSlide(content: string, contentAr: string, backgroundColor?: string, textColor?: string) {
    const supabaseAdmin = createAdminClient();

    // Get max sort order
    const { data: max } = await supabaseAdmin
        .from('header_slides')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

    const nextOrder = (max?.sort_order ?? 0) + 1;

    const { data, error } = await supabaseAdmin
        .from('header_slides')
        .insert([{
            content,
            content_ar: contentAr,
            sort_order: nextOrder,
            active: true,
            background_color: backgroundColor || null,
            text_color: textColor || null
        }])
        .select()
        .single();

    if (error) {
        console.error('Error adding header slide:', error);
        return { error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/admin/hero');
    return { success: true, data };
}

export async function deleteHeaderSlide(id: string) {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
        .from('header_slides')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting header slide:', error);
        return { error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/admin/hero');
    return { success: true };
}

export async function updateHeaderSettings(settings: Partial<HeaderSettings>) {
    const supabaseAdmin = createAdminClient();

    // Upsert settings (id always 1)
    const { error } = await supabaseAdmin
        .from('header_settings')
        .upsert({
            id: 1,
            ...settings
        });

    if (error) {
        console.error('Error updating header settings:', error);
        return { error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/admin/hero');
    return { success: true };
}
