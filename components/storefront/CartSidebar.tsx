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
    const { isCartOpen, closeCart, items, updateQuantity, removeFromCart, subtotal } = useCart();
    // Safe translation handling - usually t() calls are hook based
    // If 'Cart' namespace doesn't exist, we might get keys. 
    // We'll assume it exists or fallback is acceptable for now.
    let t;
    try {
        t = useTranslations('Cart');
    } catch (e) {
        // Fallback if useTranslations fails (e.g. no provider context in some edge cases, but here we are in app)
        t = (key: string) => key;
    }

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
                                <h2 className="text-lg font-bold font-heading uppercase text-foreground">Your Cart</h2>
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
                                items.map((item) => (
                                    <div key={`${item.productId}-${item.variant}`} className="flex gap-4 group">
                                        <div className="relative w-24 h-24 bg-card/50 rounded-lg overflow-hidden flex-shrink-0 border border-border/50">
                                            <Image src={item.image} alt={item.name} fill className="object-cover" />
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
                                                <span className="font-bold text-accent">{formatCurrency(item.price * item.quantity)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {items.length > 0 && (
                            <div className="p-6 border-t border-border/50 bg-background/50 backdrop-blur-sm space-y-4">
                                <div className="flex justify-between items-center text-xl font-bold text-foreground">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
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
