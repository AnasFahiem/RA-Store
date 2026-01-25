'use client';

import { useCart } from '@/lib/context/CartContext';
import Image from 'next/image';
import { Link } from '@/lib/navigation';
import { Trash2, Plus, Minus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { useTranslations } from 'next-intl';

export default function CartPage() {
    const { items, removeFromCart, updateQuantity, subtotal } = useCart();
    const t = useTranslations('Cart');
    const tProd = useTranslations('Product');

    if (items.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
                <h1 className="text-3xl font-bold font-heading uppercase tracking-wide mb-8 text-white">{t('title')}</h1>
                <div className="bg-zinc-900 border border-white/10 rounded-lg p-12 flex flex-col items-center">
                    <p className="text-gray-400 mb-6 text-lg">{t('empty')}</p>
                    <Link href="/products" className="px-8 py-3 bg-accent text-black font-bold uppercase tracking-wide rounded hover:bg-white transition-colors">
                        {t('startShopping')}
                    </Link>
                </div>
            </div>
        );
    }

    // Group items by Bundle
    const { groupedItems, standaloneItems } = items.reduce((acc, item) => {
        if (item.bundleId) {
            if (!acc.groupedItems[item.bundleId]) {
                acc.groupedItems[item.bundleId] = {
                    items: [],
                    details: item.bundleDetails
                };
            }
            acc.groupedItems[item.bundleId].items.push(item);
        } else {
            acc.standaloneItems.push(item);
        }
        return acc;
    }, { groupedItems: {} as Record<string, any>, standaloneItems: [] as typeof items });

    // Calculate effective total
    const effectiveSubtotal =
        standaloneItems.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0) +
        Object.values(groupedItems).reduce((sum: number, group: any) => {
            if (group.details?.priceOverride) return sum + group.details.priceOverride;
            return sum + group.items.reduce((s: number, i: any) => s + (i.price || 0) * i.quantity, 0);
        }, 0);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold font-heading uppercase tracking-wide mb-8 text-white">{t('title')}</h1>

            <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
                <section className="lg:col-span-7 space-y-8">

                    {/* Standalone Items */}
                    {standaloneItems.length > 0 && (
                        <ul className="border-t border-b border-white/10 divide-y divide-white/10">
                            {standaloneItems.map((item) => (
                                <CartItemRow
                                    key={`${item.productId}-${item.variant}`}
                                    item={item}
                                    updateQuantity={updateQuantity}
                                    removeFromCart={removeFromCart}
                                    tProd={tProd}
                                />
                            ))}
                        </ul>
                    )}

                    {/* Bundles */}
                    {Object.entries(groupedItems).map(([bundleId, group]: [string, any]) => {
                        const originalPrice = group.items.reduce((s: number, i: any) => s + (i.price || 0) * i.quantity, 0);
                        const finalPrice = group.details?.priceOverride ?? originalPrice;
                        const savings = originalPrice - finalPrice;

                        return (
                            <div key={bundleId} className="bg-zinc-900 border border-accent/30 rounded-lg overflow-hidden">
                                <div className="bg-accent/10 p-4 border-b border-white/5 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-accent text-lg flex items-center gap-2">
                                            {group.details?.name || 'Custom Bundle'}
                                            <span className="bg-accent text-black text-xs px-2 py-0.5 rounded font-bold">BUNDLE</span>
                                        </h3>
                                        <p className="text-gray-400 text-xs">Contains {group.items.length} items</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-white font-bold text-lg">{formatCurrency(finalPrice)}</div>
                                        {savings > 0 && (
                                            <div className="text-green-400 text-xs line-through">{formatCurrency(originalPrice)}</div>
                                        )}
                                    </div>
                                </div>
                                <ul className="divide-y divide-white/10 px-4">
                                    {group.items.map((item: any) => (
                                        <CartItemRow
                                            key={`${item.productId}-${item.variant}`}
                                            item={item}
                                            updateQuantity={updateQuantity}
                                            removeFromCart={removeFromCart}
                                            tProd={tProd}
                                            isBundleItem
                                        />
                                    ))}
                                </ul>
                            </div>
                        );
                    })}

                </section>

                {/* Order Summary */}
                <section
                    className="mt-16 bg-zinc-900 border border-white/10 rounded-lg px-4 py-6 sm:p-6 lg:p-8 lg:mt-0 lg:col-span-5 sticky top-24"
                >
                    <h2 className="text-lg font-medium text-white font-heading uppercase tracking-wide">{t('summary')}</h2>

                    <dl className="mt-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <dt className="text-sm text-gray-400">{t('subtotal')}</dt>
                            <dd className="text-sm font-medium text-white">{formatCurrency(effectiveSubtotal)}</dd>
                        </div>
                        <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                            <dt className="text-base font-medium text-white">{t('total')}</dt>
                            <dd className="text-base font-medium text-accent">{formatCurrency(effectiveSubtotal)}</dd>
                        </div>
                    </dl>

                    <div className="mt-6">
                        <Link
                            href="/checkout"
                            className="w-full flex justify-center items-center bg-accent border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-bold text-black hover:bg-white hover:text-black transition-all focus:outline-none uppercase tracking-wide"
                        >
                            {t('checkout')}
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}

// Helper Component for cleaner render
function CartItemRow({ item, updateQuantity, removeFromCart, tProd, isBundleItem = false }: any) {
    return (
        <li className="flex py-6 sm:py-10">
            <div className="flex-shrink-0">
                <div className="w-24 h-24 relative rounded-md overflow-hidden bg-zinc-800 border border-white/10">
                    <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover object-center"
                    />
                </div>
            </div>

            <div className="ml-4 flex-1 flex flex-col justify-between sm:ml-6">
                <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                    <div>
                        <div className="flex justify-between">
                            <h3 className="text-sm">
                                <Link href={`/products`} className="font-medium text-white hover:text-accent transition-colors">
                                    {item.name}
                                </Link>
                            </h3>
                        </div>
                        <div className="mt-1 flex text-sm">
                            <p className="text-gray-400">{item.variant ? `${tProd('size')}: ${item.variant}` : 'Standard'}</p>
                        </div>
                        {!isBundleItem && <p className="mt-1 text-sm font-medium text-white">{formatCurrency(item.price)}</p>}
                    </div>

                    <div className="mt-4 sm:mt-0 sm:pr-9">
                        <div className={`flex items-center border border-white/20 rounded-md w-max bg-zinc-900 ${isBundleItem ? 'opacity-50 pointer-events-none' : ''}`}>
                            <button
                                type="button"
                                className="p-1 text-gray-400 hover:text-white transition-colors"
                                onClick={() => updateQuantity(item.productId, item.variant, -1)}
                            >
                                <Minus className="h-4 w-4" />
                            </button>
                            <span className="mx-2 text-sm text-white">{item.quantity}</span>
                            <button
                                type="button"
                                className="p-1 text-gray-400 hover:text-white transition-colors"
                                onClick={() => updateQuantity(item.productId, item.variant, 1)}
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="absolute top-0 right-0">
                            <button
                                type="button"
                                className="-m-2 p-2 inline-flex text-gray-500 hover:text-red-400 transition-colors"
                                onClick={() => removeFromCart(item.productId, item.variant)}
                            >
                                <span className="sr-only">Remove</span>
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );
}
