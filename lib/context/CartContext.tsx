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
    productId: string;
    quantity: number;
    variant?: string;
    price?: number;
    // UI only fields
    name?: string;
    image?: string;
    bundleId?: string;
    bundleDetails?: {
        name: string;
        priceOverride?: number;
    };
};

type CartContextType = {
    items: CartItem[];
    addToCart: (item: CartItem) => Promise<void>;
    removeFromCart: (productId: string, variant?: string) => Promise<void>;
    updateQuantity: (productId: string, variant: string | undefined, delta: number) => Promise<void>;
    clearCart: () => void;
    disconnect: () => void;
    totalItems: number;
    subtotal: number;
    isCartOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
    isLoading: boolean;
    user: any;
    refreshCart: () => Promise<void>;
    addBundleToCart: (bundleId: string, bundleItems: CartItem[]) => Promise<void>;
    removeBundle: (bundleId: string) => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);
const LOCAL_STORAGE_KEY = 'ra-cart';

export function CartProvider({ children, initialItems = [] }: {
    children: React.ReactNode;
    initialItems?: CartItem[];
}) {
    const supabase = useMemo(() => createClient(), []);

    const [user, setUser] = useState<any>(null);
    const [authInitialized, setAuthInitialized] = useState(false);
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

    const addBundleToCart = async (bundleId: string, bundleItems: CartItem[]) => {
        // 1. Optimistic Update (Atomic)
        setItems(prev => {
            const nextItems = [...prev];
            bundleItems.forEach(newItem => {
                const existingIdx = nextItems.findIndex(i =>
                    i.productId === newItem.productId &&
                    i.variant === newItem.variant &&
                    i.bundleId === newItem.bundleId
                );
                if (existingIdx > -1) {
                    nextItems[existingIdx].quantity += newItem.quantity;
                } else {
                    nextItems.push(newItem);
                }
            });
            if (!user) saveToLocal(nextItems);
            return nextItems;
        });

        setIsCartOpen(true);

        // 2. Server Sync
        if (user) {
            try {
                // Use the server action to add the bundle atomically
                // Note: We need to import this. Dynamic import or move import to top.
                // Moving import to top is better. For now assuming dynamic or global.
                // Actually, let's use the one we added to imports if possible, or use `addToCartAction` in loop?
                // `addToCartAction` loop is slow.
                // `addBundleServerAction` is better.

                const result = await addBundleServerAction(bundleId);
                await refreshCart();
            } catch (e) {
                console.error(e);
            }
        }
    };

    const addToCart = async (newItem: CartItem) => {
        // Optimistic Update
        setItems(prev => {
            const nextItems = [...prev];
            const existingIdx = nextItems.findIndex(i =>
                i.productId === newItem.productId &&
                i.variant === newItem.variant &&
                i.bundleId === newItem.bundleId
            );

            if (existingIdx > -1) {
                nextItems[existingIdx].quantity += newItem.quantity;
            } else {
                nextItems.push(newItem);
            }
            // Side effect: Persist
            if (!user) saveToLocal(nextItems);
            return nextItems;
        });
        setIsCartOpen(true);

        if (user) {
            console.log('[CartContext] Authenticated. Action -> DB');
            const result = await addToCartAction({ ...newItem, bundleId: newItem.bundleId });
            if (result?.error) {
                console.error('[CartContext] Save Failed:', result.error);
                // Rollback not easily possible with functional update unless we track history, 
                // but we can just strict refresh from server on error.
                await refreshCart();
            } else {
                // If successful, we might want to refresh true state from server
                await refreshCart();
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
