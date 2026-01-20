'use client';

import { createContext, useContext, useEffect, useState } from 'react';

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
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('ra-cart');
        if (saved) {
            try {
                setItems(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse cart', e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('ra-cart', JSON.stringify(items));
    }, [items]);

    const addToCart = (newItem: CartItem) => {
        setItems((prev) => {
            const existing = prev.find(
                (i) => i.productId === newItem.productId && i.variant === newItem.variant
            );
            if (existing) {
                return prev.map((i) =>
                    i.productId === newItem.productId && i.variant === newItem.variant
                        ? { ...i, quantity: i.quantity + newItem.quantity }
                        : i
                );
            }
            return [...prev, newItem];
        });
    };

    const removeFromCart = (productId: string, variant?: string) => {
        setItems((prev) => prev.filter((i) => !(i.productId === productId && i.variant === variant)));
    };

    const updateQuantity = (productId: string, variant: string | undefined, delta: number) => {
        setItems((prev) =>
            prev.map((i) => {
                if (i.productId === productId && i.variant === variant) {
                    const newQty = Math.max(1, i.quantity + delta);
                    return { ...i, quantity: newQty };
                }
                return i;
            })
        );
    };

    const clearCart = () => setItems([]);

    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    return (
        <CartContext.Provider
            value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, subtotal }}
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
