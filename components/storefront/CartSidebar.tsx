'use client';

import { useCart } from "@/lib/context/CartContext";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Link } from '@/lib/navigation';
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils/format";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function CartSidebar() {
    const { isCartOpen, closeCart, items, updateQuantity, removeFromCart, removeBundle, subtotal } = useCart();
    // t removed

    // Mounted check to prevent hydration mismatch for portal/conditional rendering
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-background/80 backdrop-blur-md shadow-2xl z-[101] flex flex-col border-l border-white/10"
                    >
                        <div className="p-4 flex items-center justify-between border-b border-border/50">
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-accent" />
                                <h2 className="text-lg font-bold font-heading uppercase text-foreground">
                                    Your Cart
                                </h2>
                            </div>
                            <button onClick={closeCart} className="p-2 hover:bg-accent/10 rounded-full text-muted-foreground hover:text-accent transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                                    <div className="w-16 h-16 bg-accent/5 rounded-full flex items-center justify-center">
                                        <ShoppingBag className="w-8 h-8 text-accent/50" />
                                    </div>
                                    <p className="text-lg font-medium">Your cart is empty</p>
                                    <button onClick={closeCart} className="text-accent hover:text-yellow-600 font-bold underline decoration-2 underline-offset-4">
                                        Start Shopping
                                    </button>
                                </div>
                            ) : (
                                <CartItemsList
                                    items={items}
                                    removeFromCart={removeFromCart}
                                    updateQuantity={updateQuantity}
                                    removeBundle={removeBundle}
                                />
                            )}
                        </div>

                        {items.length > 0 && (
                            <div className="p-6 border-t border-border/50 bg-background/50 backdrop-blur-sm space-y-4">
                                <div className="flex justify-between items-center text-xl font-bold text-foreground">
                                    <span>Subtotal</span>
                                    <span>
                                        {formatCurrency(calculateTotal(items))}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground text-center">Shipping and taxes calculated at checkout</p>
                                <Link href="/checkout" onClick={closeCart} className="block w-full py-4 bg-foreground text-background text-center font-bold uppercase tracking-wide hover:opacity-90 transition-opacity rounded-xl shadow-lg">
                                    Checkout
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function calculateTotal(items: any[]) {
    const { groupedItems, standaloneItems } = items.reduce((acc, item) => {
        if (item.bundleId) {
            if (!acc.groupedItems[item.bundleId]) {
                acc.groupedItems[item.bundleId] = { items: [], details: item.bundleDetails };
            }
            acc.groupedItems[item.bundleId].items.push(item);
        } else {
            acc.standaloneItems.push(item);
        }
        return acc;
    }, { groupedItems: {} as Record<string, any>, standaloneItems: [] as typeof items });

    return standaloneItems.reduce((sum: number, i: any) => sum + (i.price || 0) * i.quantity, 0) +
        Object.values(groupedItems).reduce((sum: number, group: any) => {
            return sum + (group.details?.priceOverride ?? group.items.reduce((s: number, i: any) => s + (i.price || 0) * i.quantity, 0));
        }, 0);
}

function CartItemsList({ items, removeFromCart, updateQuantity, removeBundle }: any) {
    // Group Items
    const { groupedItems, standaloneItems } = items.reduce((acc: any, item: any) => {
        if (item.bundleId) {
            if (!acc.groupedItems[item.bundleId]) {
                acc.groupedItems[item.bundleId] = { items: [], details: item.bundleDetails };
            }
            acc.groupedItems[item.bundleId].items.push(item);
        } else {
            acc.standaloneItems.push(item);
        }
        return acc;
    }, { groupedItems: {}, standaloneItems: [] });

    return (
        <>
            {/* Standalone Items */}
            {standaloneItems.map((item: any) => (
                <div key={`${item.productId}-${item.variant}`} className="flex gap-4 group">
                    <div className="relative w-24 h-24 bg-card/50 rounded-lg overflow-hidden flex-shrink-0 border border-border/50">
                        <Image src={item.image || '/placeholder.jpg'} alt={item.name || 'Product'} fill className="object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-foreground line-clamp-2 leading-tight">{item.name}</h3>
                                <button onClick={() => removeFromCart(item.productId, item.variant)} className="text-muted-foreground hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            {item.variant && <p className="text-sm text-muted-foreground mt-1">Size: {item.variant}</p>}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center border border-border/50 rounded-lg overflow-hidden bg-card/30">
                                <button onClick={() => updateQuantity(item.productId, item.variant, -1)} className="p-2 hover:bg-accent/10 text-muted-foreground hover:text-accent"><Minus className="w-3 h-3" /></button>
                                <span className="px-3 text-sm font-bold text-foreground">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.productId, item.variant, 1)} className="p-2 hover:bg-accent/10 text-muted-foreground hover:text-accent"><Plus className="w-3 h-3" /></button>
                            </div>
                            <span className="font-bold text-accent">{formatCurrency((item.price || 0) * item.quantity)}</span>
                        </div>
                    </div>
                </div>
            ))}

            {/* Bundles */}
            {Object.entries(groupedItems).map(([bundleId, group]: [string, any]) => {
                const originalPrice = group.items.reduce((s: number, i: any) => s + (i.price || 0) * i.quantity, 0);
                const finalPrice = group.details?.priceOverride ?? originalPrice;
                const savings = originalPrice - finalPrice;

                return (
                    <div key={bundleId} className="relative bg-zinc-900/50 rounded-xl p-3 border-2 border-accent/20 overflow-hidden">
                        {/* Bundle Highlight Frame/Tag */}
                        <div className="absolute top-0 right-0 bg-accent text-black text-[10px] font-bold px-2 py-0.5 rounded-bl-lg z-10">
                            BUNDLE
                        </div>

                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-accent/10">
                            <div>
                                <p className="text-accent text-sm font-bold">{group.details?.name || 'Custom Bundle'}</p>
                                {savings > 0 && <span className="text-[10px] text-green-400 block">Save {formatCurrency(savings)}</span>}
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="text-right">
                                    <div className="text-white font-bold text-sm">{formatCurrency(finalPrice)}</div>
                                    {savings > 0 && <div className="text-[10px] text-gray-500 line-through">{formatCurrency(originalPrice)}</div>}
                                </div>
                                <button
                                    onClick={() => removeBundle(bundleId)}
                                    className="text-muted-foreground hover:text-red-500 transition-colors p-0.5"
                                    title="Remove Bundle"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {group.items.map((item: any) => (
                                <div key={`${item.productId}-${item.variant}`} className="flex gap-3 relative">
                                    {/* Vertical connector line */}
                                    <div className="absolute -left-2 top-0 bottom-0 w-0.5 bg-accent/10 rounded-full"></div>

                                    <div className="relative w-16 h-16 bg-card/30 rounded-lg overflow-hidden flex-shrink-0 border border-border/20 group-hover:border-accent/40 transition-colors">
                                        <Image src={item.image || '/placeholder.jpg'} alt={item.name || 'Product'} fill className="object-cover" />
                                    </div>

                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-xs font-bold text-foreground line-clamp-1">{item.name}</h3>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">Qty: {item.quantity} {item.variant && `(${item.variant})`}</p>
                                        </div>
                                        <div className="flex items-center justify-end">
                                            {/* Individual item deletion removed for bundle items */}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </>
    );
}
