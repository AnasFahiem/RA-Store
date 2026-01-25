'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function getHeroSlides() {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
        .from('hero_slides')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Error fetching hero slides:', error);
        return [];
    }

    return data;
}

export async function addHeroSlide(imageUrl: string) {
    // Get current max order to append to end
    const supabaseAdmin = createAdminClient();
    const { data: maxOrderData } = await supabaseAdmin
        .from('hero_slides')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

    const nextOrder = (maxOrderData?.sort_order ?? 0) + 1;

    // Re-use existing admin client? Or just use variable if I scoped it?
    // I scoped it inside addHeroSlide so it's 'supabaseAdmin' variable is available?
    // Wait, in previous chunk I defined 'const supabaseAdmin = createAdminClient();' inside addHeroSlide.
    // So logic flow continues.

    const { data, error } = await supabaseAdmin
        .from('hero_slides')
        .insert([
            {
                image_url: imageUrl,
                sort_order: nextOrder,
                active: true
            }
        ])
        .select()
        .single();

    if (error) {
        console.error('Error adding hero slide:', error);
        return { error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/admin/hero');
    return { success: true, data };
}

export async function deleteHeroSlide(id: string) {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
        .from('hero_slides')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting hero slide:', error);
        return { error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/admin/hero');
    return { success: true };
}

export async function updateHeroSlideOrder(items: { id: string; sort_order: number }[]) {
    // Supabase doesn't support bulk update with different values easily in one query without RPC
    // So we'll loop for now, or use a case statement if performance is critical (unlikely for < 10 slides)

    const supabaseAdmin = createAdminClient();

    const updates = items.map(item =>
        supabaseAdmin
            .from('hero_slides')
            .update({ sort_order: item.sort_order })
            .eq('id', item.id)
    );

    await Promise.all(updates);

    revalidatePath('/');
    revalidatePath('/admin/hero');
    return { success: true };
}
