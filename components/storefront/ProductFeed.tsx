'use client';

import { useState, useMemo } from 'react';
import ProductCard from './ProductCard';
import BundleCard from './BundleCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Product {
    id: string;
    name: string;
    name_ar?: string; // Optional since it might not be relevant for sorting if purely by price
    price: number;
    category: string;
    image: string;
    variants: any[];
}

interface Bundle {
    id: string;
    name: string;
    price_override?: number;
    image?: string;
    items: any[];
}

interface ProductFeedProps {
    products: Product[];
    bundles: Bundle[];
}

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

type EnrichedProduct = Product & { type: 'product' };
type EnrichedBundle = Bundle & { type: 'bundle'; price: number; category: string };
type DisplayItem = EnrichedProduct | EnrichedBundle;

export default function ProductFeed({ products, bundles }: ProductFeedProps) {
    const t = useTranslations('Store');
    const [activeCategory, setActiveCategory] = useState('all');
    const [sortOption, setSortOption] = useState<SortOption>('featured');
    const [isSortOpen, setIsSortOpen] = useState(false);

    // Extract unique categories from products
    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category).filter(Boolean));
        return ['all', 'bundles', ...Array.from(cats)];
    }, [products]);

    const displayedItems = useMemo(() => {
        let items: DisplayItem[] = [];

        // 1. Combine and Filter
        if (activeCategory === 'bundles') {
            items = bundles.map(b => ({ ...b, type: 'bundle' as const, price: b.price_override ?? 0, category: 'bundles' }));
        } else if (activeCategory === 'all') {
            const productItems = products.map(p => ({ ...p, type: 'product' as const }));
            const bundleItems = bundles.map(b => ({ ...b, type: 'bundle' as const, price: b.price_override ?? 0, category: 'bundles' }));
            items = [...bundleItems, ...productItems];
        } else {
            items = products
                .filter(p => p.category === activeCategory)
                .map(p => ({ ...p, type: 'product' as const }));
        }

        // 2. Sort
        return items.sort((a, b) => {
            switch (sortOption) {
                case 'price-asc':
                    return (a.price || 0) - (b.price || 0);
                case 'price-desc':
                    return (b.price || 0) - (a.price || 0);
                case 'name-asc':
                    return a.name.localeCompare(b.name);
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                default:
                    // Featured: Bundles first, then products
                    if (a.type === 'bundle' && b.type !== 'bundle') return -1;
                    if (a.type !== 'bundle' && b.type === 'bundle') return 1;
                    return 0;
            }
        });
    }, [activeCategory, sortOption, products, bundles]);

    const sortOptions = [
        { id: 'featured', label: t('sort.featured') },
        { id: 'price-asc', label: t('sort.priceLowHigh') },
        { id: 'price-desc', label: t('sort.priceHighLow') },
        { id: 'name-asc', label: t('sort.nameAZ') },
        { id: 'name-desc', label: t('sort.nameZA') },
    ];

    const currentSortLabel = sortOptions.find(o => o.id === sortOption)?.label;

    return (
        <div className="space-y-8">
            {/* Controls Header */}
            <div className="flex flex-col gap-4 md:gap-6 md:flex-row justify-between items-start md:items-center py-2">

                {/* Categories - Wrap on mobile */}
                <div className="w-full md:w-auto">
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => {
                            // Try to get translation, fallback to capitalized category name
                            let categoryLabel: string;
                            try {
                                categoryLabel = t(`categories.${cat.toLowerCase()}`);
                                // If translation returns the key itself, use fallback
                                if (categoryLabel.includes('categories.')) {
                                    categoryLabel = cat.charAt(0).toUpperCase() + cat.slice(1);
                                }
                            } catch {
                                categoryLabel = cat.charAt(0).toUpperCase() + cat.slice(1);
                            }

                            return (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`
                                        px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-wide whitespace-nowrap transition-all duration-300 border
                                        ${activeCategory === cat
                                            ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-lg shadow-black/10 dark:shadow-white/10'
                                            : 'bg-gray-100 text-gray-600 border-transparent hover:border-gray-300 hover:text-black hover:bg-white dark:bg-zinc-900/50 dark:text-gray-400 dark:border-white/5 dark:hover:border-white/20 dark:hover:text-white dark:hover:bg-zinc-900'}
                                    `}
                                >
                                    {categoryLabel}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Sort Dropdown */}
                <div className="relative z-40 self-end md:self-auto">
                    <button
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="flex items-center gap-3 px-5 py-2.5 rounded-full text-sm font-bold transition-all border
                        bg-gray-100 text-gray-700 border-transparent hover:bg-white hover:border-gray-200 hover:text-black
                        dark:bg-zinc-900/50 dark:text-gray-300 dark:border-white/5 dark:hover:border-white/20 dark:hover:text-white dark:hover:bg-zinc-900"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span>{t('sort.label')}: {currentSortLabel}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isSortOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl overflow-hidden py-2
                                bg-white border border-gray-100
                                dark:bg-zinc-900 dark:border-white/10"
                            >
                                {sortOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => {
                                            setSortOption(option.id as SortOption);
                                            setIsSortOpen(false);
                                        }}
                                        className={`w-full text-left px-5 py-3 text-sm font-medium transition-colors 
                                        hover:bg-gray-50 dark:hover:bg-white/5
                                        ${sortOption === option.id
                                                ? 'text-accent'
                                                : 'text-gray-600 dark:text-gray-400'}`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                <AnimatePresence mode='popLayout'>
                    {displayedItems.map((item) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            key={item.id}
                        >
                            {item.type === 'bundle' ? (
                                <BundleCard {...(item as Bundle)} />
                            ) : (
                                <ProductCard {...(item as Product)} />
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {displayedItems.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                    <p>No products found in this category.</p>
                </div>
            )}
        </div>
    );
}
