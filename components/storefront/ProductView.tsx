'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ShoppingCart, Star, Truck, ShieldCheck, Undo2, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';
import { formatCurrency } from '@/lib/utils/format';
import { Link } from '@/lib/navigation';
import { useTranslations, useLocale } from 'next-intl';

type Product = {
    id: string;
    name: string;
    name_ar?: string;
    description: string;
    description_ar?: string;
    base_price: number;
    category: string;
    images: string[];
    sizes?: string[]; // array of strings
};

export default function ProductView({ product }: { product: Product }) {
    const { addToCart } = useCart();
    const t = useTranslations('Product');
    const locale = useLocale();
    const isRTL = locale === 'ar';

    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);

    // Fallback if no images
    const images = product.images?.length > 0 ? product.images : ['/placeholder.svg'];
    const activeImage = images[selectedImage];

    // Localized Text
    const displayName = isRTL && product.name_ar ? product.name_ar : product.name;
    const displayDescription = isRTL && product.description_ar ? product.description_ar : product.description;

    const handleAddToCart = () => {
        if (product.sizes && product.sizes.length > 0 && !selectedSize) {
            alert(t('selectSize')); // Could be a toast
            return;
        }

        addToCart({
            productId: product.id,
            name: displayName,
            price: product.base_price,
            image: images[0],
            quantity: quantity,
            variant: selectedSize || undefined,
        });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-background text-foreground transition-colors duration-300">
            <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 ${isRTL ? 'lg:rtl' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>

                {/* LEFT: Gallery */}
                <div className="col-span-12 lg:col-span-5">
                    <div className="sticky top-24">
                        {/* Main Image */}
                        {/* Main Image */}
                        <div
                            className="relative aspect-square w-full bg-secondary/10 rounded-lg overflow-hidden border border-border mb-4 group cursor-zoom-in"
                            onMouseMove={(e) => {
                                const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                                const x = ((e.clientX - left) / width) * 100;
                                const y = ((e.clientY - top) / height) * 100;
                                e.currentTarget.style.setProperty('--zoom-origin', `${x}% ${y}%`);
                            }}
                        >
                            <Image
                                src={activeImage}
                                alt={displayName}
                                fill
                                className="object-contain object-center p-4 transition-transform duration-200 ease-out group-hover:scale-[2]"
                                style={{ transformOrigin: 'var(--zoom-origin, 50% 50%)' }}
                                priority
                            />
                        </div>
                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-accent ring-1 ring-accent' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        <Image
                                            src={img}
                                            alt={`View ${idx + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* CENTER: Info */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-accent font-medium mb-1 uppercase tracking-wide">
                            {/* Breadcrumb-ish or Category */}
                            {product.category}
                        </div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">{displayName}</h1>

                        <div className="border-t border-b border-gray-100 dark:border-gray-800 py-4 my-2">
                            <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-bold text-foreground">{formatCurrency(product.base_price)}</span>
                                <span className="text-sm text-muted">{t('inStock')}</span>
                            </div>
                        </div>

                        {/* Sizing */}
                        {product.sizes && product.sizes.length > 0 && (
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="font-bold text-sm text-foreground">{t('selectSize')}: <span className="text-accent">{selectedSize}</span></label>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {product.sizes.map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`min-w-[3rem] h-10 px-3 flex items-center justify-center border rounded-md text-sm font-bold transition-all ${selectedSize === size
                                                ? 'border-accent bg-accent text-white shadow-md transform scale-105'
                                                : 'border-gray-300 dark:border-gray-700 bg-background text-foreground hover:border-accent hover:text-accent'
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <div className="prose prose-sm text-muted-foreground dark:text-gray-400">
                            <h3 className="text-sm font-bold text-foreground uppercase mb-2">{t('details')}</h3>
                            <p className="whitespace-pre-line leading-relaxed">{displayDescription}</p>
                        </div>

                        {/* Trust Signals */}
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="flex items-start gap-2">
                                <Truck className="w-5 h-5 text-accent flex-shrink-0" />
                                <span className="text-xs text-muted-foreground">{t('shipsFrom')}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <ShieldCheck className="w-5 h-5 text-accent flex-shrink-0" />
                                <span className="text-xs text-muted-foreground">{t('secure')}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Undo2 className="w-5 h-5 text-accent flex-shrink-0" />
                                <span className="text-xs text-muted-foreground">{t('returnPolicy')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Buy Box */}
                <div className="col-span-12 lg:col-span-3">
                    <div className="sticky top-24 border border-gray-200 dark:border-gray-800 rounded-lg p-6 shadow-sm bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="mb-4">
                            <span className="text-2xl font-bold text-foreground block mb-1">{formatCurrency(product.base_price)}</span>
                            <span className="text-sm text-green-600 font-medium">{t('freeReturns')}</span>
                            <div className="text-sm text-muted-foreground mt-2">
                                {t('delivery')} <span className="font-bold text-foreground">Tomorrow, Jan 21</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-sm px-3 py-1 rounded w-fit font-medium">
                                {t('inStock')}
                            </div>

                            {/* Quantity */}
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-foreground">{t('quantity')}:</label>
                                <select
                                    value={quantity}
                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                    className="border border-gray-300 dark:border-gray-700 rounded px-2 py-1 bg-background text-foreground text-sm focus:border-accent outline-none"
                                >
                                    {[1, 2, 3, 4, 5, 10].map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                className="w-full py-3 bg-accent hover:bg-yellow-600 text-black font-bold rounded-full shadow-md transition-colors flex justify-center items-center gap-2"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                {t('addToCart')}
                            </button>

                            <button
                                onClick={() => { handleAddToCart(); /* Then redirect */ }}
                                className="w-full py-3 bg-foreground hover:bg-zinc-800 dark:hover:bg-zinc-200 text-background font-bold rounded-full shadow-md transition-colors border border-foreground/10"
                            >
                                {t('buyNow')}
                            </button>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 text-xs text-muted-foreground space-y-1">
                            <div className="flex justify-between">
                                <span>Ships from</span>
                                <span className="font-medium text-foreground">RA Store</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Sold by</span>
                                <span className="font-medium text-foreground">RA Store</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
