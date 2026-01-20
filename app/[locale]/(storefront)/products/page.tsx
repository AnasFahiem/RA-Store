import ProductCard from '@/components/storefront/ProductCard';
import { supabase } from '@/lib/supabase';

async function getProducts() {
    const { data } = await supabase.from('products').select('*');

    if (!data) return [];

    return data.map(p => {
        let imageUrl = '';

        // Handle images array (Postgres array or JSONb) or JSON string
        if (Array.isArray(p.images) && p.images.length > 0) {
            imageUrl = p.images[0];
        } else if (typeof p.images === 'string') {
            try {
                const parsed = JSON.parse(p.images);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    imageUrl = parsed[0];
                }
            } catch (e) {
                // If not JSON, assume it's a single URL string (legacy/fallback)
                if (p.images.startsWith('http')) {
                    imageUrl = p.images;
                }
            }
        }

        // Fallback to legacy image_url if still empty
        if (!imageUrl && p.image_url) {
            imageUrl = p.image_url;
        }

        return {
            id: p.id,
            name: p.name,
            name_ar: p.name_ar,
            price: p.base_price,
            category: p.category,
            image: imageUrl,
            variants: p.variants || []
        };
    });
}

export default async function ProductsPage() {
    const products = await getProducts();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold font-heading uppercase tracking-wide mb-8">All Gear</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {products.map((product) => (
                    <ProductCard key={product.id} {...product} />
                ))}
            </div>
        </div>
    );
}
