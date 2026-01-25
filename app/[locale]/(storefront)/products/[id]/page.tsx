import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProductView from '@/components/storefront/ProductView';

interface Props {
    params: Promise<{
        locale: string;
        id: string;
    }>;
}

export default async function ProductPage({ params }: Props) {
    const { id } = await params;

    const supabase = await createClient();

    const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

    if (!product) {
        notFound();
    }

    // Parse images if needed
    let parsedImages: string[] = [];
    if (Array.isArray(product.images)) {
        parsedImages = product.images;
    } else if (typeof product.images === 'string') {
        try {
            parsedImages = JSON.parse(product.images);
        } catch (e) {
            console.error('Failed to parse product images', e);
            // Fallback
            if (product.images.startsWith('http')) {
                parsedImages = [product.images];
            }
        }
    }

    // Fallback to legacy image_url if images is empty
    if (parsedImages.length === 0 && product.image_url) {
        parsedImages = [product.image_url];
    }

    const cleanedProduct = {
        ...product,
        images: parsedImages
    };

    return <ProductView product={cleanedProduct} />;
}
