'use client';

import { useState } from 'react';
// Removed addBundleToCart to avoid naming conflict
import { useCart } from '@/lib/context/CartContext';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { useRouter } from '@/lib/navigation';

interface Props {
    bundleId: string;
    price: number;
    bundleName: string;
    items: any[];
}

export default function AddBundleButton({ bundleId, price, bundleName, items }: Props) {
    const [loading, setLoading] = useState(false);
    const { addToCart, addBundleToCart, openCart } = useCart();
    // Router not needed for drawer approach
    // const router = useRouter(); 

    const handleAdd = async () => {
        setLoading(true);
        try {
            // Prepare items for Context
            const cartItems = items.map(item => {
                // Image parsing logic
                let imageUrl = '/placeholder.jpg';
                const rawImages = item.product.images;
                if (Array.isArray(rawImages) && rawImages.length > 0) imageUrl = rawImages[0];
                else if (typeof rawImages === 'string') {
                    try {
                        const parsed = JSON.parse(rawImages);
                        if (Array.isArray(parsed) && parsed.length > 0) imageUrl = parsed[0];
                        else if (parsed.startsWith('http')) imageUrl = parsed;
                    } catch { if ((rawImages as string).startsWith('http')) imageUrl = rawImages; }
                }

                return {
                    productId: item.product.id,
                    quantity: item.quantity,
                    name: item.product.name,
                    price: item.product.base_price,
                    image: imageUrl,
                    bundleId: bundleId,
                    bundleDetails: {
                        name: bundleName,
                        priceOverride: price
                    }
                };
            });

            await addBundleToCart(bundleId, cartItems);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleAdd}
            disabled={loading}
            className="w-full sm:w-auto bg-accent text-black font-bold text-lg uppercase tracking-wider px-12 py-4 rounded hover:bg-white transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingBag className="h-5 w-5" />}
            {loading ? 'Adding...' : 'Add Bundle to Cart'}
        </button>
    );
}
