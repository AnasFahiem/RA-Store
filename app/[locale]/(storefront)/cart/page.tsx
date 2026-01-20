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
                <h1 className="text-3xl font-bold font-heading uppercase tracking-wide mb-8">{t('title')}</h1>
                <div className="bg-gray-50 rounded-lg p-12 flex flex-col items-center">
                    <p className="text-gray-500 mb-6 text-lg">{t('empty')}</p>
                    <Link href="/products" className="px-8 py-3 bg-primary text-white font-bold uppercase tracking-wide rounded hover:bg-black transition-colors">
                        {t('startShopping')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold font-heading uppercase tracking-wide mb-8">{t('title')}</h1>

            <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
                <section className="lg:col-span-7">
                    <ul role="list" className="border-t border-b border-gray-200 divide-y divide-gray-200">
                        {items.map((item) => (
                            <li key={`${item.productId}-${item.variant}`} className="flex py-6 sm:py-10">
                                <div className="flex-shrink-0">
                                    <div className="w-24 h-24 relative rounded-md overflow-hidden bg-gray-100">
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
                                                    <Link href={`/products`} className="font-medium text-gray-700 hover:text-gray-800">
                                                        {item.name}
                                                    </Link>
                                                </h3>
                                            </div>
                                            <div className="mt-1 flex text-sm">
                                                <p className="text-gray-500">{item.variant ? `${tProd('size')}: ${item.variant}` : 'Standard'}</p>
                                            </div>
                                            <p className="mt-1 text-sm font-medium text-gray-900">{formatCurrency(item.price)}</p>
                                        </div>

                                        <div className="mt-4 sm:mt-0 sm:pr-9">
                                            <div className="flex items-center border border-gray-300 rounded-md w-max">
                                                <button
                                                    type="button"
                                                    className="p-1 text-gray-600 hover:text-gray-900"
                                                    onClick={() => updateQuantity(item.productId, item.variant, -1)}
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>
                                                <span className="mx-2 text-sm text-gray-700">{item.quantity}</span>
                                                <button
                                                    type="button"
                                                    className="p-1 text-gray-600 hover:text-gray-900"
                                                    onClick={() => updateQuantity(item.productId, item.variant, 1)}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="absolute top-0 right-0">
                                                <button
                                                    type="button"
                                                    className="-m-2 p-2 inline-flex text-gray-400 hover:text-gray-500"
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
                        ))}
                    </ul>
                </section>

                {/* Order Summary */}
                <section
                    className="mt-16 bg-gray-50 rounded-lg px-4 py-6 sm:p-6 lg:p-8 lg:mt-0 lg:col-span-5"
                >
                    <h2 className="text-lg font-medium text-gray-900 font-heading uppercase tracking-wide">{t('summary')}</h2>

                    <dl className="mt-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <dt className="text-sm text-gray-600">{t('subtotal')}</dt>
                            <dd className="text-sm font-medium text-gray-900">{formatCurrency(subtotal)}</dd>
                        </div>
                        <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                            <dt className="text-base font-medium text-gray-900">{t('total')}</dt>
                            <dd className="text-base font-medium text-gray-900">{formatCurrency(subtotal)}</dd>
                        </div>
                    </dl>

                    <div className="mt-6">
                        <button
                            type="button"
                            className="w-full bg-primary border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-primary uppercase tracking-wide"
                        >
                            {t('checkout')}
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
