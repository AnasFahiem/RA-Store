'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { addToCartAction, removeFromCartAction, updateQuantityAction, syncCartAction, getCart } from '@/lib/actions/cart';

type CartItem = {
    productId: string;
    name: string;
    price: number;
    image: string;
    variant?: string;
    quantity: number;
};

type CartContextType = {
    items: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (productId: string, variant?: string) => void;
    updateQuantity: (productId: string, variant: string | undefined, delta: number) => void;
    clearCart: () => void;
    totalItems: number;
    subtotal: number;
    isCartOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'ra-cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = createClient();

    // Helper to persist to LS only if guest
    const saveToLocal = (newItems: CartItem[]) => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newItems));
    };

    // Initial Logic: Mount & Auth State Changes
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth State Change:', event);
            const currentUser = session?.user || null;
            console.log('Session User:', currentUser?.id);
            setUser(currentUser);

            if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && currentUser)) {
                // USER LOGIC
                // 1. Check for local guest items to merge
                const localSaved = localStorage.getItem(LOCAL_STORAGE_KEY);
                if (localSaved) {
                    try {
                        const localItems = JSON.parse(localSaved);
                        if (localItems.length > 0) {
                            console.log('Found local items to sync:', localItems);
                            await syncCartAction(localItems);
                        }
                    } catch (e) {
                        console.error('Error parsing local cart for sync', e);
                    }
                    // 2. CRITICAL: Wipe local storage immediately after sync logic
                    localStorage.removeItem(LOCAL_STORAGE_KEY);
                }

                // 3. Fetch canonical state from DB
                const dbItems = await getCart();
                setItems(dbItems);

            } else if (event === 'SIGNED_OUT') {
                // LOGOUT LOGIC
                // Just clear state. Do NOT read from LS (previous user data was wiped on login, or it's empty).
                // Do NOT write to LS (we don't want to save the cleared state over a potential guest cart if that were possible, but here it's just reset).
                setItems([]);

            } else if (event === 'INITIAL_SESSION' && !currentUser) {
                // GUEST INITIAL LOAD
                const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
                if (saved) {
                    try {
                        setItems(JSON.parse(saved));
                    } catch (e) { console.error(e); }
                }
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);


    const addToCart = async (newItem: CartItem) => {
        // 1. Calculate New State
        let nextItems: CartItem[] = [];
        setItems((prev) => {
            const existing = prev.find(i => i.productId === newItem.productId && i.variant === newItem.variant);
            if (existing) {
                nextItems = prev.map(i => i.productId === newItem.productId && i.variant === newItem.variant
                    ? { ...i, quantity: i.quantity + newItem.quantity } : i);
            } else {
                nextItems = [...prev, newItem];
            }
            return nextItems;
        });
        setIsCartOpen(true);
        console.log('Cart Action: Add', newItem);
        console.log('Current User:', user);

        // 2. Branching Persistence
        if (user) {
            console.log('Persisting to DB via Action');
            await addToCartAction(newItem);
        } else {
            console.log('Persisting to LocalStorage');
            saveToLocal(nextItems);
        }
    };

    const removeFromCart = async (productId: string, variant?: string) => {
        // 1. Calculate New State
        let nextItems: CartItem[] = [];
        setItems((prev) => {
            nextItems = prev.filter(i => !(i.productId === productId && i.variant === variant));
            return nextItems;
        });

        // 2. Branching Persistence
        if (user) {
            await removeFromCartAction(productId, variant);
        } else {
            saveToLocal(nextItems);
        }
    };

    const updateQuantity = async (productId: string, variant: string | undefined, delta: number) => {
        // 1. Calculate New State
        let nextItems: CartItem[] = [];
        let newQty = 0;

        setItems((prev) => {
            nextItems = prev.map((i) => {
                if (i.productId === productId && i.variant === variant) {
                    newQty = Math.max(1, i.quantity + delta);
                    return { ...i, quantity: newQty };
                }
                return i;
            });
            return nextItems;
        });

        // 2. Branching Persistence
        if (user) {
            await updateQuantityAction(productId, variant, newQty);
        } else {
            saveToLocal(nextItems);
        }
    };

    const clearCart = () => {
        setItems([]);
        if (!user) {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
        // If user, strictly speaking we should clear DB too if this is an explicit "Empty Cart" action.
        // But if it's just "Post Checkout", the checkout process handles DB side typically.
        // For now, client state clear is fine.
    };

    const openCart = () => setIsCartOpen(true);
    const closeCart = () => setIsCartOpen(false);

    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    return (
        <CartContext.Provider
            value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, subtotal, isCartOpen, openCart, closeCart }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
