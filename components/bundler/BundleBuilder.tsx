'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Plus, Minus, ShoppingBag, Gift, X } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { createBundle, addBundleToCart } from '@/lib/actions/bundleActions';
import { useRouter } from '@/lib/navigation';
import { useTranslations } from 'next-intl';

interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
}

interface DiscountRule {
    id: string;
    name: string;
    min_quantity: number;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    required_category?: string;
}

interface BundleBuilderProps {
    products: Product[];
    discountRules: DiscountRule[];
    adminBundles: any[]; // For suggestions
}

export default function BundleBuilder({ products, discountRules, adminBundles }: BundleBuilderProps) {
    const [selectedItems, setSelectedItems] = useState<{ product: Product; quantity: number }[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const totalQuantity = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

    // Calculate totals
    const subtotal = selectedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    // Apply best applicable discount
    const activeDiscount = useMemo(() => {
        // Sort rules by min_quantity desc to find highest tier
        const sortedRules = [...discountRules].sort((a, b) => b.min_quantity - a.min_quantity);

        for (const rule of sortedRules) {
            if (totalQuantity >= rule.min_quantity) {
                // Check category requirement if exists
                if (rule.required_category) {
                    const hasCategory = selectedItems.some(i => i.product.category === rule.required_category);
                    if (!hasCategory) continue;
                }
                return rule;
            }
        }
        return null;
    }, [discountRules, totalQuantity, selectedItems]);

    // Next discount goal
    const nextDiscount = useMemo(() => {
        const sortedRules = [...discountRules].sort((a, b) => a.min_quantity - b.min_quantity);
        return sortedRules.find(r => r.min_quantity > totalQuantity);
    }, [discountRules, totalQuantity]);

    const discountAmount = useMemo(() => {
        if (!activeDiscount) return 0;
        if (activeDiscount.discount_type === 'percentage') {
            return subtotal * (activeDiscount.discount_value / 100);
        }
        return activeDiscount.discount_value;
    }, [activeDiscount, subtotal]);

    const total = subtotal - discountAmount;

    // Handlers
    const addItem = (product: Product) => {
        setSelectedItems(prev => {
            const existing = prev.find(p => p.product.id === product.id);
            if (existing) {
                return prev.map(p => p.product.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const removeItem = (productId: string) => {
        setSelectedItems(prev => prev.filter(p => p.product.id !== productId));
    };

    const updateQuantity = (productId: string, delta: number) => {
        setSelectedItems(prev => {
            return prev.map(p => {
                if (p.product.id === productId) {
                    const newQty = p.quantity + delta;
                    if (newQty <= 0) return null; // Remove if 0
                    return { ...p, quantity: newQty };
                }
                return p;
            }).filter(Boolean) as { product: Product; quantity: number }[];
        });
    };

    const handleAddToCart = async () => {
        if (selectedItems.length === 0) return;
        setLoading(true);

        try {
            // 1. Create the Custom Bundle
            const bundleData = {
                name: `Custom Bundle (${totalQuantity} items)`,
                type: 'user_custom',
                items: selectedItems.map(i => ({ productId: i.product.id, quantity: i.quantity })),
                priceOverride: total // Optional: we could rely on recalculation, but saving it helps
            };

            const result = await createBundle(bundleData);
            if (!result.success || !result.bundleId) {
                alert('Failed to create bundle');
                return;
            }

            // 2. Add to Cart
            const cartResult = await addBundleToCart(result.bundleId);
            if (!cartResult.success) {
                alert(cartResult.error || 'Failed to add to cart');
                return;
            }

            // 3. Redirect
            router.push('/cart');
        } catch (e) {
            console.error(e);
            alert('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    // Smart Suggestions: Find an admin bundle that partially matches current selection
    const suggestions = useMemo(() => {
        if (selectedItems.length === 0) return [];

        // Simple logic: if user has product A, and Admin Bundle has A + B, suggest B.
        const suggestedProducts: Product[] = [];

        adminBundles.forEach(bundle => {
            const bundleProductIds = bundle.items.map((i: any) => i.product.id);
            const userProductIds = selectedItems.map(i => i.product.id);

            // Check intersection
            const hasOverlap = bundleProductIds.some((id: string) => userProductIds.includes(id));

            if (hasOverlap) {
                // Find items in bundle NOT in user selection
                const newItems = bundle.items
                    .filter((i: any) => !userProductIds.includes(i.product.id))
                    .map((i: any) => ({
                        id: i.product.id,
                        name: i.product.name,
                        price: i.product.base_price, // Assuming admin bundle items are populated
                        image: i.product.images?.[0] || '',
                        category: i.product.category
                    }));
                suggestedProducts.push(...newItems);
            }
        });

        // Dedupe
        return Array.from(new Set(suggestedProducts.map(p => p.id)))
            .map(id => suggestedProducts.find(p => p.id === id)!);

    }, [selectedItems, adminBundles]);

    const t = useTranslations('Bundler');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Product Picker */}
            <div className="lg:col-span-8 space-y-8">
                {/* Product Grid */}
                <div className="bg-white/50 dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 rounded-lg p-6 backdrop-blur-sm">
                    <h2 className="text-xl font-bold mb-4 text-foreground">{t('selectProducts')}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {products.map(product => (
                            <div key={product.id} className="bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded p-4 flex flex-col group hover:border-accent transition-colors shadow-sm dark:shadow-none">
                                <div className="relative aspect-square mb-3 bg-gray-100 dark:bg-zinc-800 rounded overflow-hidden">
                                    {product.image && (
                                        <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform" />
                                    )}
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">{product.name}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{formatCurrency(product.price)}</p>
                                <button
                                    onClick={() => addItem(product)}
                                    className="mt-auto w-full bg-gray-100 hover:bg-accent text-gray-900 hover:text-black dark:bg-white/10 dark:text-white py-2 rounded text-sm font-bold transition-colors"
                                >
                                    {t('addToBundle')}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Suggestions */}
                {suggestions.length > 0 && (
                    <div className="bg-white/50 dark:bg-zinc-900/50 border border-accent/20 rounded-lg p-6 backdrop-blur-sm">
                        <h2 className="text-xl font-bold mb-4 text-accent flex items-center gap-2">
                            <Gift className="h-5 w-5" />
                            {t('suggestionsTitle')}
                        </h2>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {suggestions.map(product => (
                                <div key={product.id} className="min-w-[150px] bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded p-3 flex flex-col shadow-sm dark:shadow-none">
                                    <div className="relative h-24 mb-2 bg-gray-100 dark:bg-zinc-800 rounded">
                                        {product.image && <Image src={product.image} fill className="object-cover" alt={product.name} />}
                                    </div>
                                    <p className="font-bold text-gray-900 dark:text-white text-xs line-clamp-1">{product.name}</p>
                                    <button
                                        onClick={() => addItem(product)}
                                        className="mt-2 text-xs bg-accent text-black px-2 py-1 rounded font-bold hover:bg-yellow-600 transition-colors"
                                    >
                                        {t('add')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Right: Bundle State & Totals */}
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-lg p-6 sticky top-24 shadow-lg dark:shadow-none">
                    <h2 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5" />
                        {t('yourBundle')}
                    </h2>

                    {/* Discount Meter */}
                    <div className="mb-6 bg-gray-50 dark:bg-black/50 rounded-lg p-4 border border-gray-200 dark:border-white/5">
                        {activeDiscount ? (
                            <div className="text-accent text-sm font-bold mb-1">
                                {activeDiscount.discount_type === 'percentage'
                                    ? t('discountActiveTags.percentage', { value: activeDiscount.discount_value })
                                    : t('discountActiveTags.fixed', { value: formatCurrency(activeDiscount.discount_value) })}
                            </div>
                        ) : (
                            <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">{t('addItemsUnlock')}</div>
                        )}

                        {nextDiscount && (
                            <div className="mt-2">
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                    <span>{t('itemsCount', { count: totalQuantity })}</span>
                                    <span>{t('goal', { count: nextDiscount.min_quantity })}</span>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent transition-all duration-500"
                                        style={{ width: `${Math.min((totalQuantity / nextDiscount.min_quantity) * 100, 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                    {t('addMoreForDiscount', { count: nextDiscount.min_quantity - totalQuantity })}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Selected Items List */}
                    <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {selectedItems.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">{t('emptyBundle')}</p>
                        ) : (
                            selectedItems.map(({ product, quantity }) => (
                                <div key={product.id} className="flex gap-3 items-center">
                                    <div className="relative w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded flex-shrink-0">
                                        {product.image && <Image src={product.image} fill className="object-cover rounded" alt={product.name} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{product.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatCurrency(product.price)}</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 rounded px-2 py-1">
                                        <button onClick={() => updateQuantity(product.id, -1)} className="hover:text-black dark:hover:text-white text-gray-400"><Minus className="h-3 w-3" /></button>
                                        <span className="text-sm font-bold w-4 text-center text-gray-900 dark:text-white">{quantity}</span>
                                        <button onClick={() => updateQuantity(product.id, 1)} className="hover:text-black dark:hover:text-white text-gray-400"><Plus className="h-3 w-3" /></button>
                                    </div>
                                    <button onClick={() => removeItem(product.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Totals */}
                    <div className="border-t border-gray-200 dark:border-white/10 pt-4 space-y-2">
                        <div className="flex justify-between text-gray-500 dark:text-gray-400">
                            <span>{t('subtotal')}</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        {activeDiscount && (
                            <div className="flex justify-between text-accent">
                                <span>{t('discount')}</span>
                                <span>-{formatCurrency(discountAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xl font-bold text-foreground pt-2 border-t border-gray-200 dark:border-white/10">
                            <span>{t('total')}</span>
                            <span>{formatCurrency(total)}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleAddToCart}
                        disabled={selectedItems.length === 0 || loading}
                        className="w-full mt-6 bg-accent text-black py-4 rounded-lg font-bold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-lg shadow-md"
                    >
                        {loading ? t('creatingBundle') : t('addToCart')}
                    </button>
                </div>
            </div>
        </div>
    );
}
