'use server';

import { ProductService } from '@/services/products';

export async function searchProducts(query: string) {
    if (!query || query.length < 1) {
        return [];
    }

    console.log(`[SearchAction] Starting search for: "${query}"`);

    try {
        return await ProductService.searchProducts(query);
    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
}

export async function getAllProducts() {
    try {
        return await ProductService.getProducts();
    } catch (error) {
        console.error('getAllProducts error:', error);
        return [];
    }
}
