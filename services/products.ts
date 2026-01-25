import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ProductInput } from '@/lib/validations/products';

export class ProductService {
    // Public/Read-Only Methods (Server Client)
    static async getProducts(limit = 50) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('products')
            .select('id, name, base_price, images, category')
            .order('name')
            .limit(limit);

        if (error) throw new Error(`Fetch products failed: ${error.message}`);
        return this.mapProducts(data);
    }

    static async searchProducts(query: string) {
        if (!query) return [];
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('products')
            .select('id, name, name_ar, base_price, images, category')
            .or(`name.ilike.%${query}%,name_ar.ilike.%${query}%`)
            .limit(8);

        if (error) throw new Error(`Search failed: ${error.message}`);
        return this.mapProducts(data);
    }

    static async getProductById(id: string) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return data;
    }

    // Admin/Write Actions (Admin Client)
    static async createProduct(data: ProductInput) {
        const supabaseAdmin = createAdminClient();

        // Parse JSON fields
        const images = this.parseJsonField(data.images);
        const sizes = this.parseJsonField(data.sizes);

        const { data: product, error } = await supabaseAdmin
            .from('products')
            .insert({
                name: data.name,
                name_ar: data.name_ar,
                description: data.description,
                description_ar: data.description_ar,
                base_price: data.base_price,
                category: data.category,
                images,
                sizes,
                items_in_stock: 10 // Default
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return product;
    }

    static async updateProduct(id: string, data: ProductInput) {
        const supabaseAdmin = createAdminClient();

        const images = this.parseJsonField(data.images);
        const sizes = this.parseJsonField(data.sizes);

        const { error } = await supabaseAdmin
            .from('products')
            .update({
                name: data.name,
                name_ar: data.name_ar,
                description: data.description,
                description_ar: data.description_ar,
                base_price: data.base_price,
                category: data.category,
                images,
                sizes
            })
            .eq('id', id);

        if (error) throw new Error(error.message);
        return true;
    }

    static async deleteProduct(id: string) {
        const supabaseAdmin = createAdminClient();
        const { error } = await supabaseAdmin
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw new Error(error.message);
        return true;
    }

    // Helpers
    private static mapProducts(data: any[]) {
        if (!data) return [];
        return data.map(p => ({
            ...p,
            price: p.base_price,
            image: Array.isArray(p.images) ? p.images[0] : p.images
        }));
    }

    private static parseJsonField(field: string | undefined): any[] {
        if (!field) return [];
        try {
            const parsed = JSON.parse(field);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
}
