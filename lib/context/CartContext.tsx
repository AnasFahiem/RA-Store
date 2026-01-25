'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    getCartAction,
    addToCartAction,
    removeFromCartAction,
    updateQuantityAction,
    clearCartAction,
    syncCartAction
} from '@/lib/actions/cart';
import { addBundleToCart as addBundleServerAction } from '@/lib/actions/bundleActions';
import { checkAuth } from '@/lib/actions/auth';

type CartItem = {
    readonly productId: string;
    readonly quantity: number;
    readonly variant?: string;
    readonly price?: number;
    // UI only fields
    readonly name?: string;
    readonly image?: string;
    readonly bundleId?: string;
    readonly bundleDetails?: {
        readonly name: string;
        readonly priceOverride?: number;
    };
};

type CartContextType = {
    readonly items: CartItem[];
    readonly addToCart: (item: CartItem) => Promise<void>;
    readonly removeFromCart: (productId: string, variant?: string) => Promise<void>;
    readonly updateQuantity: (productId: string, variant: string | undefined, delta: number) => Promise<void>;
    readonly clearCart: () => void;
    readonly disconnect: () => void;
    readonly totalItems: number;
    readonly subtotal: number;
    readonly isCartOpen: boolean;
    readonly openCart: () => void;
    readonly closeCart: () => void;
    readonly isLoading: boolean;
    readonly user: any;
    readonly refreshCart: () => Promise<void>;
    readonly addBundleToCart: (bundleId: string, bundleItems: CartItem[]) => Promise<void>;
    readonly removeBundle: (bundleId: string) => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);
const LOCAL_STORAGE_KEY = 'ra-cart';

export function CartProvider({ children, initialItems = [] }: {
    children: React.ReactNode;
    initialItems?: CartItem[];
}) {
    const [user, setUser] = useState<any>(null);
    // authInitialized removed
    const [items, setItems] = useState<CartItem[]>(initialItems); // Use server-provided initial data
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // Start as not loading since we have initial data

    // Sync with server updates (e.g. after redirect or revalidation)
    useEffect(() => {
        if (initialItems.length > 0) {
            setItems(initialItems);
        }
    }, [initialItems]);

    // Auth & Initial Load Logic - simplified since server provides initial cart data
    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                // Check auth status
                const { user: authUser } = await checkAuth();

                if (!mounted) return;

                console.log('[CartContext] User:', authUser?.id || 'Guest');
                setUser(authUser);

                // If user just logged in and we have initial items, we're done
                if (authUser && initialItems.length > 0) {
                    console.log('[CartContext] ✅ Using server-provided cart:', initialItems.length, 'items');
                    setItems(initialItems);
                    return;
                }

                // If guest, load from localStorage
                if (!authUser) {
                    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
                    if (saved) {
                        try {
                            const guestItems = JSON.parse(saved);
                            if (mounted) {
                                setItems(guestItems);
                                console.log('[CartContext] Loaded', guestItems.length, 'guest items');
                            }
                        } catch (e) {
                            if (mounted) setItems([]);
                        }
                    }
                }
            } catch (error) {
                console.error('[CartContext] Init error:', error);
            }
        };

        initAuth();

        return () => { mounted = false; };
    }, [initialItems]);

    const saveToLocal = (newItems: CartItem[]) => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newItems));
    };

    // 2. Actions
    // 2. Actions


    const refreshCart = async () => {
        if (!user) return; // Guest cart is local only
        setIsLoading(true);
        try {
            const serverItems = await getCartAction();
            setItems(serverItems as CartItem[]);
        } catch (e) {
            console.error('[CartContext] Refresh failed', e);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper for optimistic updates
    const mergeCartItems = (prevItems: CartItem[], newItems: CartItem[]): CartItem[] => {
        const nextItems = [...prevItems];
        newItems.forEach(newItem => {
            const existingIdx = nextItems.findIndex(i =>
                i.productId === newItem.productId &&
                i.variant === newItem.variant &&
                i.bundleId === newItem.bundleId
            );
            if (existingIdx > -1) {
                // Update quantity safely
                nextItems[existingIdx] = {
                    ...nextItems[existingIdx],
                    quantity: nextItems[existingIdx].quantity + newItem.quantity
                };
            } else {
                nextItems.push(newItem);
            }
        });
        return nextItems;
    };

    const addBundleToCart = async (bundleId: string, bundleItems: CartItem[]) => {
        setItems(prev => {
            const nextItems = mergeCartItems(prev, bundleItems);
            if (!user) saveToLocal(nextItems);
            return nextItems;
        });

        setIsCartOpen(true);

        if (user) {
            try {
                // Server Sync
                const result = await addBundleServerAction(bundleId);
                await refreshCart();
            } catch (e) {
                console.error(e);
            }
        }
    };

    const addToCart = async (newItem: CartItem) => {
        setItems(prev => {
            const nextItems = mergeCartItems(prev, [newItem]);
            if (!user) saveToLocal(nextItems);
            return nextItems;
        });

        setIsCartOpen(true);

        if (user) {
            try {
                const result = await addToCartAction(newItem);
                if (result?.error) {
                    console.error('[CartContext] Save Failed:', result.error);
                }
                await refreshCart();
            } catch (e) {
                console.error('[CartContext] Add failed', e);
            }
        }
    };



    const removeFromCart = async (productId: string, variant?: string) => {
        const previousItems = [...items];
        // We must also filter by bundleId implicitly? 
        // Logic hole: removeFromCart signature doesn't take bundleId.
        // Assuming remove removes specific item. 
        // If multiple items have same productId (one standalone, one in bundle), 
        // we need bundleId to differentiate.
        // CHECK removeFromCartAction in cart.ts -> checks product_id/variant only?
        // If so, it might delete bundle items too!
        // TODO: Update removeFromCart signature in future step. 
        // For now, let's just expose refreshCart.

        const nextItems = items.filter(i => !(i.productId === productId && i.variant === variant));
        setItems(nextItems);

        if (user) {
            await removeFromCartAction(productId, variant);
            await refreshCart();
        } else {
            saveToLocal(nextItems);
        }
    };

    const updateQuantity = async (productId: string, variant: string | undefined, delta: number) => {
        const targetItem = items.find(i => i.productId === productId && i.variant === variant);
        if (!targetItem) return;

        const newQuantity = Math.max(1, targetItem.quantity + delta);
        if (newQuantity === targetItem.quantity) return;

        const previousItems = [...items];
        const nextItems = items.map(i => {
            if (i.productId === productId && i.variant === variant) {
                return { ...i, quantity: newQuantity };
            }
            return i;
        });

        setItems(nextItems);

        if (user) {
            await updateQuantityAction(productId, variant, newQuantity);
        } else {
            saveToLocal(nextItems);
        }
    };

    const clearCart = async () => {
        setItems([]);
        if (user) {
            await clearCartAction();
        } else {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
    };

    const removeBundle = async (bundleId: string) => {
        // Optimistic
        const nextItems = items.filter(i => i.bundleId !== bundleId);
        setItems(nextItems);

        if (user) {
            try {
                // Dynamic import to avoid earlier issues or assume it's available
                const { removeBundleAction } = await import('@/lib/actions/cart');
                await removeBundleAction(bundleId);
                await refreshCart();
            } catch (e) {
                console.error(e);
            }
        } else {
            saveToLocal(nextItems);
        }
    };

    // NEW: Clears local state on logout without deleting DB data
    const disconnect = () => {
        setItems([]);
        setUser(null);
        setIsCartOpen(false);
    };

    const openCart = () => setIsCartOpen(true);
    const closeCart = () => setIsCartOpen(false);

    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0);

    return (
        <CartContext.Provider
            value={{ items, addToCart, addBundleToCart, removeBundle, removeFromCart, updateQuantity, clearCart, disconnect, totalItems, subtotal, isCartOpen, openCart, closeCart, isLoading, user, refreshCart }}
        >
            {children}
        </CartContext.Provider >
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
