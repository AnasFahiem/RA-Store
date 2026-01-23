'use server';

import { supabase } from '@/lib/supabase';

export async function searchProducts(query: string) {
    if (!query || query.length < 1) {
        return [];
    }

    console.log(`[SearchAction] Starting search for: "${query}"`);

    const { data, error } = await supabase
        .from('products')
        .select('id, name, base_price, images, category')
        .ilike('name', `%${query}%`)
        .limit(8);

    console.log(`[SearchAction] DB Result: ${data?.length} items, Error: ${error?.message}`);

    if (error) {
        // Silently fail or log to server monitoring if available
        // console.error('Search Supabase error:', error);
        return [];
    }

    // Map base_price to price for frontend compatibility
    return data.map((product: any) => ({
        ...product,
        price: product.base_price,
        image: Array.isArray(product.images) ? product.images[0] : product.images
    }));
}

export async function getAllProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('id, name, base_price, images, category')
        .order('name');

    if (error) {
        console.error('getAllProducts error:', error);
        return [];
    }

    return data.map((product: any) => ({
        ...product,
        price: product.base_price,
        image: Array.isArray(product.images) ? product.images[0] : product.images
    }));
}
