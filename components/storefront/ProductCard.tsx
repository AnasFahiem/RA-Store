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
    readonly name: string;
    readonly name_ar?: string;
    readonly price: number;
    readonly image: string;
    readonly category: string;
    readonly variants?: { readonly name: string; readonly sku: string }[];
};

export default function ProductCard({ id, name, name_ar, price, image, category, variants }: { readonly id: string } & Omit<ProductProps, 'id'>) {
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
            <Link href={`/products/${id}`} className="block relative aspect-square w-full rounded-lg bg-gray-100 dark:bg-zinc-800 mb-4 overflow-hidden border border-transparent dark:border-white/10">
                {displayImage ? (
                    <Image
                        src={displayImage}
                        alt={displayName}
                        fill
                        className="object-contain object-center group-hover:scale-105 transition-transform duration-300 p-2"
                        onError={(e) => {
                            // Fallback on error
                            const target = e.target as HTMLImageElement;
                            if (target.src !== globalThis.location.origin + '/placeholder.jpg') {
                                target.src = '/placeholder.jpg';
                            }
                        }}
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-zinc-900 flex items-center justify-center text-gray-400">
                        <ShoppingBag className="h-12 w-12 opacity-20" />
                    </div>
                )}
                <button
                    onClick={handleAddToCart}
                    className="absolute bottom-4 right-4 bg-background dark:bg-zinc-900 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent hover:text-white z-10 text-foreground"
                    title={t('addToCart')}
                >
                    <ShoppingBag className="h-6 w-6" />
                </button>
            </Link>

            <div className="flex flex-col gap-1">
                <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">{category}</p>
                <Link href={`/products/${id}`}>
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-foreground font-heading uppercase tracking-wide hover:text-accent transition-colors line-clamp-2">
                        {displayName}
                    </h3>
                </Link>
                <p className="text-sm sm:text-base md:text-lg font-bold text-accent">{formatCurrency(price)}</p>
            </div>

            {variants && variants.length > 0 && (
                <div className="mt-2 flex gap-2">
                    {variants.map(v => (
                        <button
                            key={v.name}
                            onClick={() => setSelectedVariant(v.name)}
                            className={`text-xs border px-2 py-1 rounded transition-colors ${selectedVariant === v.name
                                ? 'border-accent text-accent'
                                : 'border-gray-200 dark:border-zinc-700 text-muted-foreground hover:border-gray-300 dark:hover:border-zinc-500'}`}
                        >
                            {v.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
