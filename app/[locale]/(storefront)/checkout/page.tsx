'use client';

import { useCart } from "@/lib/context/CartContext";
import { formatCurrency } from "@/lib/utils/format";
import { placeOrder } from "@/lib/actions/orderActions";
import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";

export default function CheckoutPage() {
    const { items, subtotal, clearCart, totalItems } = useCart();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            city: formData.get('city'),
            items: items
        };

        try {
            const res = await placeOrder(data);
            if (res.success) {
                clearCart();
                // Redirect to a specific success page or home with a query param
                // For now, just home with alert (better UX would be dedicated page)
                alert(`Order placed successfully! Order ID: ${res.orderId}`);
                router.push('/');
            } else {
                setError(res.error as string);
            }
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    if (items.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-white/80 backdrop-blur-sm rounded-xl max-w-2xl mx-auto my-12">
                <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
                <p className="text-gray-600 mb-8">Add some items to get started.</p>
                <button onClick={() => router.push('/products')} className="px-6 py-3 bg-black text-white rounded-lg font-bold hover:bg-zinc-800 transition">
                    Browse Products
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-heading font-bold mb-8 text-center uppercase tracking-wider text-white mix-blend-difference">Checkout</h1>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-7">
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm">1</span>
                            Shipping Information
                        </h2>

                        <form id="checkout-form" onSubmit={onSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input required name="name" type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition" placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input required name="phone" type="tel" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition" placeholder="+1 234 567 890" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input required name="email" type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition" placeholder="john@example.com" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                                <input required name="address" type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition" placeholder="123 Main St" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input required name="city" type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition" placeholder="New York" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code (Optional)</label>
                                    <input name="zip" type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition" placeholder="10001" />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                                    {error}
                                </div>
                            )}
                        </form>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-5">
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 sticky top-24">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm">2</span>
                            Order Summary
                        </h2>

                        <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2">
                            {items.map((item) => (
                                <div key={`${item.productId}-${item.variant}`} className="flex gap-4 items-center">
                                    <div className="relative w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm text-gray-900 line-clamp-1">{item.name}</p>
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>Qty: {item.quantity} {item.variant && `(${item.variant})`}</span>
                                            <span>{formatCurrency(item.price * item.quantity)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal ({totalItems} items)</span>
                                <span className="font-bold">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Shipping</span>
                                <span className="font-bold text-green-600">Free</span>
                            </div>
                            <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between text-xl font-bold">
                                <span>Total</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            form="checkout-form"
                            disabled={loading}
                            className="w-full mt-6 py-4 bg-accent hover:bg-yellow-600 text-black font-bold uppercase tracking-wide rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                'Confirm Order'
                            )}
                        </button>
                        <p className="text-xs text-center text-gray-400 mt-4">
                            By placing this order, you agree to our Terms of Service and Privacy Policy.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
