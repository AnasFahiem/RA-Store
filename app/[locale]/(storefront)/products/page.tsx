import { supabase } from '@/lib/supabase';
import { getAdminBundles } from '@/lib/actions/bundleActions';
import ProductFeed from '@/components/storefront/ProductFeed';
import { getTranslations } from 'next-intl/server';

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
    const [products, bundles] = await Promise.all([
        getProducts(),
        getAdminBundles()
    ]);
    const t = await getTranslations('Products');

    return (
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
            <div className="mb-8 sm:mb-12">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-heading uppercase tracking-wide mb-3 sm:mb-4 text-black dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-gray-500">
                    {t('title')}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl">
                    {t('description')}
                </p>
            </div>

            <ProductFeed products={products} bundles={bundles} />
        </div>
    );
}
