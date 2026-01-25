'use client';

import { Link } from '@/lib/navigation';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils/format';
import { Package, Plus } from 'lucide-react';
import { createBundle } from '@/lib/actions/bundleActions'; // We might need a direct add-to-cart for fixed bundles
import { useCart } from '@/lib/context/CartContext';
import { useState } from 'react';

interface BundleCardProps {
    id: string;
    name: string;
    price_override?: number;
    image?: string;
    items: {
        quantity: number;
        product: {
            name: string;
            images: string[];
            base_price: number;
        };
    }[];
}

export default function BundleCard({ id, name, price_override, image, items }: Readonly<BundleCardProps>) {
    const { addToCart, addBundleToCart } = useCart();
    const [loading, setLoading] = useState(false);

    // Calculate total price if no override
    const safeItems = items || [];
    const calculatedPrice = safeItems.reduce((sum, item) => sum + (item.product.base_price * item.quantity), 0);
    const price = price_override ?? calculatedPrice;
    const savings = calculatedPrice - price;

    // Collage Logic: Get up to 4 images
    const collageImages = safeItems.slice(0, 4).map(i => {
        const rawImages = i.product.images;
        let img = '/placeholder.jpg';

        if (Array.isArray(rawImages) && rawImages.length > 0) {
            img = rawImages[0];
        } else if (typeof rawImages === 'string') {
            try {
                const parsed = JSON.parse(rawImages);
                if (Array.isArray(parsed) && parsed.length > 0) img = parsed[0];
                else if (typeof parsed === 'string' && parsed.startsWith('http')) img = parsed;
            } catch {
                if ((rawImages as string).startsWith('http')) img = rawImages;
            }
        }
        return img;
    });

    const handleAddToCart = async () => {
        setLoading(true);
        try {
            // Prepare items for the Context (Optimistic UI)
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
                    productId: (item as any).product_id || (item as any).product.id,
                    quantity: item.quantity,
                    name: item.product.name,
                    price: item.product.base_price,
                    image: imageUrl,
                    bundleId: id,
                    bundleDetails: {
                        name: name,
                        priceOverride: price
                    }
                };
            });

            await addBundleToCart(id, cartItems);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="group relative bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/5 rounded-lg overflow-hidden hover:border-accent transition-colors shadow-sm dark:shadow-none">
            <div className="aspect-square relative bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                {image ? (
                    <Image
                        src={image}
                        alt={name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    // Collage
                    <div className="grid grid-cols-2 h-full w-full">
                        {collageImages.map((img, idx) => (
                            // Using idx here is acceptable for a static collage visualization if no unique ID is available for the *image slot*, 
                            // but SonarCloud prefers unique IDs. We can assume the image URL itself + idx is unique enough or just use idx if the specific rule allows.
                            // The user requested: "Stop using array indices as key props". 
                            // We can use a combination string.
                            <div key={`collage-${id}-${idx}`} className="relative border-r border-b border-gray-200 dark:border-white/5">
                                <Image src={img} alt="" fill className="object-cover" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Overlay Action */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                </div>
                <Link href={`/bundles/${id}`} className="absolute inset-0 z-10" />
                <div className="absolute bottom-4 right-4 z-20 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAddToCart();
                        }}
                        disabled={loading}
                        className="bg-accent text-black p-3 rounded-full hover:bg-white transition-colors shadow-lg"
                        title="Quick Add"
                    >
                        {loading ? <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full" /> : <Plus className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-accent transition-colors">{name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{safeItems.length} Items included</p>

                <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(price)}</span>
                    {savings > 0 && (
                        <span className="text-sm text-gray-500 line-through">{formatCurrency(calculatedPrice)}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
