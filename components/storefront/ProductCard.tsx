'use client';

import Image from 'next/image';
import { useCart } from '@/lib/context/CartContext';
import { ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '@/lib/utils/format';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';

type ProductProps = {
    id: string;
    name: string;
    name_ar?: string;
    price: number;
    image: string;
    category: string;
    variants?: { name: string; sku: string }[];
};

export default function ProductCard({ id, name, name_ar, price, image, category, variants }: ProductProps) {
    const { addToCart } = useCart();
    const [selectedVariant, setSelectedVariant] = useState(variants?.[0]?.name);
    const t = useTranslations('Product');
    const locale = useLocale();

    const displayName = locale === 'ar' ? (name_ar || name) : name;

    // Fallback image
    const displayImage = image || '/placeholder.svg';

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        addToCart({
            productId: id,
            name: displayName,
            price,
            image: displayImage,
            quantity: 1,
            variant: selectedVariant,
        });
    };

    return (
        <div className="group relative flex flex-col">
            <Link href={`/products/${id}`} className="block relative aspect-square w-full rounded-lg bg-gray-100 mb-4 overflow-hidden">
                {displayImage ? (
                    <Image
                        src={displayImage}
                        alt={displayName}
                        fill
                        className="object-contain object-center group-hover:scale-105 transition-transform duration-300 p-2"
                        onError={(e) => {
                            // Fallback on error
                            const target = e.target as HTMLImageElement;
                            if (target.src !== window.location.origin + '/placeholder.jpg') {
                                target.src = '/placeholder.jpg';
                            }
                        }}
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                        <ShoppingBag className="h-12 w-12 opacity-20" />
                    </div>
                )}
                <button
                    onClick={handleAddToCart}
                    className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent hover:text-white z-10"
                    title={t('addToCart')}
                >
                    <ShoppingBag className="h-6 w-6" />
                </button>
            </Link>

            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm text-gray-500 mb-1">{t('category')}: {category}</p>
                    <Link href={`/products/${id}`}>
                        <h3 className="text-lg font-bold text-gray-900 font-heading uppercase tracking-wide hover:text-accent transition-colors">
                            {displayName}
                        </h3>
                    </Link>
                </div>
                <p className="text-lg font-medium text-gray-900">{formatCurrency(price)}</p>
            </div>

            {variants && variants.length > 0 && (
                <div className="mt-2 flex gap-2">
                    {variants.map(v => (
                        <button
                            key={v.name}
                            onClick={() => setSelectedVariant(v.name)}
                            className={`text-xs border px-2 py-1 rounded ${selectedVariant === v.name ? 'border-accent text-accent' : 'border-gray-200 text-gray-500'}`}
                        >
                            {v.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
