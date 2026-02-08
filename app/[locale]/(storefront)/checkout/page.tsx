'use client';

import { useCart } from "@/lib/context/CartContext";
import { formatCurrency } from "@/lib/utils/format";
import { placeOrder, getSavedAddresses, getUserProfile } from "@/lib/actions/orderActions";
import { useState, useEffect } from "react";
import { useRouter } from "@/lib/navigation";
import Image from "next/image";
import { Loader2, Ticket } from "lucide-react";
import OrderSuccessModal from "@/components/shared/OrderSuccessModal";
import { validatePromoCode } from "@/lib/actions/bundleActions";

export default function CheckoutPage() {
    const { items, clearCart, totalItems } = useCart();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data State
    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

    // User Selection State
    const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');
    const [shouldSaveAddress, setShouldSaveAddress] = useState(false);

    // Form State (for controlled inputs to allow pre-filling)
    const [contactInfo, setContactInfo] = useState({
        name: '',
        email: '',
        phone: ''
    });

    // Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [createdOrderId, setCreatedOrderId] = useState<string>('');

    // Promo Code State
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<any>(null);
    const [isCheckingPromo, setIsCheckingPromo] = useState(false);
    const [promoError, setPromoError] = useState<string | null>(null);
    const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) return;

        setIsCheckingPromo(true);
        setPromoError(null);
        setPromoSuccess(null);

        try {
            const result = await validatePromoCode(promoCode.trim());
            console.log('Promo Result:', result); // Debug

            if (result.valid && result.promo) {
                setAppliedPromo(result.promo);
                setPromoSuccess('Promo code applied successfully!');
            } else {
                setPromoError(result.error || 'Invalid code');
                setAppliedPromo(null);
            }
        } catch (err) {
            console.error('Promo error:', err);
            setPromoError('Failed to validate code');
        } finally {
            setIsCheckingPromo(false);
        }
    };

    const handleRemovePromo = () => {
        setAppliedPromo(null);
        setPromoCode('');
        setPromoError(null);
        setPromoSuccess(null);
    };

    // Fetch Data on Mount
    useEffect(() => {
        async function fetchData() {
            try {
                // 1. Fetch User Profile
                const profile = await getUserProfile();
                if (profile) {
                    setContactInfo({
                        name: profile.name || '',
                        email: profile.email || '',
                        phone: profile.phone || ''
                    });
                }

                // 2. Fetch Saved Addresses
                const addresses = await getSavedAddresses();
                if (addresses && addresses.length > 0) {
                    setSavedAddresses(addresses);
                    // Default to the first saved address (most recent)
                    setSelectedAddressId(addresses[0].id);
                }
            } catch (error) {
                console.error("Failed to load checkout data:", error);
            }
        }
        fetchData();
    }, []);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        // If using saved address, manually populate address fields validation if needed, 
        // OR just pass the ID and let backend handle? 
        // Backend expects 'address', 'city', etc. 
        // If selectedAddressId !== 'new', we inject the values from the selected address into the payload.

        let submitData: any = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            items: items,
            saveAddress: shouldSaveAddress, // Only relevant for new address
            promoCode: appliedPromo ? appliedPromo.code : null
        };

        if (selectedAddressId === 'new') {
            submitData.address = formData.get('address');
            submitData.city = formData.get('city');
            submitData.saveAddress = shouldSaveAddress;
        } else {
            const addr = savedAddresses.find(a => a.id === selectedAddressId);
            if (!addr) {
                setError("Selected address not found");
                setLoading(false);
                return;
            }
            submitData.address = addr.address_line;
            submitData.city = addr.city;
        }

        try {
            const res = await placeOrder(submitData);
            if (res.success) {
                clearCart();
                setCreatedOrderId(res.orderId as string);
                setShowSuccessModal(true);
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

    // Better approach: calculate once
    // Better approach: calculate once
    const { finalTotal, effectiveSubtotal, discountAmount } = (() => {
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

        const standAloneTotal = standaloneItems.reduce((sum, i) => sum + (i.price || 0) * i.quantity, 0);
        const bundlesTotal = Object.values(groupedItems).reduce((sum: number, group: any) => {
            return sum + (group.details?.priceOverride ?? group.items.reduce((s: number, i: any) => s + (i.price || 0) * i.quantity, 0));
        }, 0);

        const total = standAloneTotal + bundlesTotal;

        // Calculate Discount
        let discount = 0;
        if (appliedPromo) {
            if (appliedPromo.type === 'percentage') {
                discount = (total * appliedPromo.value) / 100;
            } else {
                discount = appliedPromo.value;
            }
            // Cap discount at total
            discount = Math.min(discount, total);
        }

        const effectiveTotal = total - discount;

        return {
            finalTotal: effectiveTotal,
            effectiveSubtotal: total,
            discountAmount: discount
        };
    })();

    if (items.length === 0 && !showSuccessModal) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-card backdrop-blur-sm rounded-xl max-w-2xl mx-auto my-12 border border-border">
                <h1 className="text-2xl font-bold mb-4 text-foreground">Your cart is empty</h1>
                <p className="text-muted-foreground mb-8">Add some items to get started.</p>
                <button onClick={() => router.push('/products')} className="px-6 py-3 bg-accent hover:bg-accent/90 text-black rounded-lg font-bold transition">
                    Browse Products
                </button>
            </div>
        );
    }

    // selectedSavedAddress removed

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-heading font-bold mb-8 uppercase tracking-wider text-foreground">Checkout</h1>

            <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Contact & Shipping */}
                <div className="lg:col-span-7 space-y-8">
                    {/* 1. Contact Information */}
                    <div>
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-foreground">
                            <span className="w-8 h-8 rounded-full bg-accent text-black flex items-center justify-center text-sm font-bold">1</span>
                            Contact Information
                        </h2>
                        {/* Contact Form Fields */}
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="checkout-name" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
                                <input id="checkout-name" required name="name" type="text" value={contactInfo.name} onChange={e => setContactInfo({ ...contactInfo, name: e.target.value })} className="w-full px-4 py-3 border border-white/10 rounded-sm bg-black/50 text-white placeholder-gray-500 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition" placeholder="John Doe" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="checkout-email" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
                                    <input id="checkout-email" required name="email" type="email" value={contactInfo.email} onChange={e => setContactInfo({ ...contactInfo, email: e.target.value })} className="w-full px-4 py-3 border border-white/10 rounded-sm bg-black/50 text-white placeholder-gray-500 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition" placeholder="john@example.com" />
                                </div>
                                <div>
                                    <label htmlFor="checkout-phone" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number</label>
                                    <input id="checkout-phone" required name="phone" type="tel" value={contactInfo.phone} onChange={e => setContactInfo({ ...contactInfo, phone: e.target.value })} className="w-full px-4 py-3 border border-white/10 rounded-sm bg-black/50 text-white placeholder-gray-500 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition" placeholder="+20 123 456 7890" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Shipping Address */}
                    <div>
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-foreground">
                            <span className="w-8 h-8 rounded-full bg-accent text-black flex items-center justify-center text-sm font-bold">2</span>
                            Shipping Address
                        </h2>
                        <div className="space-y-4">
                            {/* Saved Addresses Logic Placeholder - Maintaining structure */}
                            {savedAddresses.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedAddressId(savedAddresses[0].id)}
                                    className={`w-full text-left relative cursor-pointer border rounded-sm p-4 transition-all mb-4 ${selectedAddressId === savedAddresses[0].id ? 'border-accent bg-accent/10' : 'border-white/10 bg-black/20 hover:border-white/20'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center ${selectedAddressId === savedAddresses[0].id ? 'border-accent bg-accent' : 'border-gray-500'}`}>
                                            {selectedAddressId === savedAddresses[0].id && <div className="w-2 h-2 bg-black rounded-full" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white mb-1">Use Saved Address</p>
                                            <p className="text-gray-300 text-sm">{savedAddresses[0].address_line}</p>
                                            <p className="text-gray-400 text-sm">{savedAddresses[0].city}{savedAddresses[0].city ? ',' : ''} Egypt</p>
                                        </div>
                                    </div>
                                </button>
                            )}
                            <div className={`border rounded-sm transition-all ${selectedAddressId === 'new' ? 'border-white/20 bg-black/20' : 'border-white/10 bg-black/20 hover:border-white/20'}`}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedAddressId('new')}
                                    className="w-full text-left p-4 flex items-center gap-3"
                                >
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedAddressId === 'new' ? 'border-accent bg-accent' : 'border-gray-500'}`}>
                                        {selectedAddressId === 'new' && <div className="w-2 h-2 bg-black rounded-full" />}
                                    </div>
                                    <p className="font-medium text-white">+ New Address</p>
                                </button>
                                {selectedAddressId === 'new' && (
                                    <div className="px-4 pb-4 pl-8 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div>
                                            <label htmlFor="checkout-address" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Street Address</label>
                                            <input id="checkout-address" required={selectedAddressId === 'new'} name="address" type="text" className="w-full px-4 py-3 border border-white/10 rounded-sm bg-black/50 text-white placeholder-gray-500 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition" placeholder="123 Main St" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="checkout-city" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">City</label>
                                                <input id="checkout-city" required={selectedAddressId === 'new'} name="city" type="text" className="w-full px-4 py-3 border border-white/10 rounded-sm bg-black/50 text-white placeholder-gray-500 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition" placeholder="Cairo" />
                                            </div>
                                            <div>
                                                <label htmlFor="checkout-zip" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Postal Code (Optional)</label>
                                                <input id="checkout-zip" name="zip" type="text" className="w-full px-4 py-3 border border-white/10 rounded-sm bg-black/50 text-white placeholder-gray-500 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition" placeholder="11311" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="save-address" checked={shouldSaveAddress} onChange={(e) => setShouldSaveAddress(e.target.checked)} className="w-4 h-4 rounded border-white/20 text-accent focus:ring-accent bg-black" />
                                            <label htmlFor="save-address" className="text-sm text-gray-300">Save this address for future orders</label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Order Summary */}
                <div className="lg:col-span-5">
                    <div className="bg-zinc-900/50 border border-white/5 rounded-lg p-6 sticky top-24">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-foreground">
                            <span className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-sm font-bold">2</span>
                            Order Summary
                        </h2>

                        <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {(() => {
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

                                return (
                                    <>
                                        {/* Standalone Items */}
                                        {standaloneItems.map((item) => (
                                            <div key={`${item.productId}-${item.variant}`} className="flex gap-4 items-center py-2 border-b border-white/5 last:border-0">
                                                <div className="relative w-16 h-16 bg-zinc-800 rounded-md overflow-hidden flex-shrink-0">
                                                    {item.image ? (
                                                        <Image src={item.image || ''} alt={item.name || ''} fill className="object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No Img</div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-sm text-white line-clamp-1">{item.name}</p>
                                                    <p className="text-xs text-gray-400 mt-1">Qty: {item.quantity} {item.variant && `(${item.variant})`}</p>
                                                </div>
                                                <div className="text-sm font-bold text-white">
                                                    {formatCurrency((item.price || 0) * item.quantity)}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Bundles */}
                                        {Object.entries(groupedItems).map(([bundleId, group]: [string, any]) => {
                                            const originalPrice = group.items.reduce((s: number, i: any) => s + (i.price || 0) * i.quantity, 0);
                                            const finalPrice = group.details?.priceOverride ?? originalPrice;

                                            return (
                                                <div key={bundleId} className="bg-white/5 rounded-md p-3 border border-white/10">
                                                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                                                        <p className="text-accent text-sm font-bold flex items-center gap-2">
                                                            {group.details?.name || 'Bundle'}
                                                            <span className="bg-accent text-black text-[10px] px-1 rounded">KIT</span>
                                                        </p>
                                                        <p className="text-white font-bold text-sm">{formatCurrency(finalPrice)}</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {group.items.map((item: any) => (
                                                            <div key={`${item.productId}-${item.variant}`} className="flex gap-3 items-center opacity-70">
                                                                <div className="relative w-8 h-8 bg-zinc-800 rounded flex-shrink-0">
                                                                    {item.image && <Image src={item.image} alt={item.name || ''} fill className="object-cover rounded" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs text-white truncate">{item.name}</p>
                                                                    <p className="text-[10px] text-gray-400">Qty: {item.quantity}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
                                );
                            })()}
                        </div>

                        <div className="border-t border-white/10 pt-4 space-y-2 text-sm mb-6">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Subtotal ({totalItems} items)</span>
                                <span className="font-bold text-white">
                                    {formatCurrency(effectiveSubtotal)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Shipping</span>
                                <span className="font-bold text-accent">Free</span>
                            </div>

                            {/* Promo Code Input */}
                            <div className="pt-2 pb-2">
                                {!appliedPromo ? (
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                placeholder="Promo Code"
                                                value={promoCode}
                                                onChange={(e) => setPromoCode(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:border-accent/50 uppercase placeholder:normal-case"
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyPromo())}
                                            />
                                            <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleApplyPromo}
                                            disabled={isCheckingPromo || !promoCode.trim()}
                                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-sm font-bold text-white transition-colors disabled:opacity-50"
                                        >
                                            {isCheckingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between bg-green-900/10 border border-green-900/30 p-2 rounded-md">
                                        <div className="flex items-center gap-2">
                                            <Ticket className="w-4 h-4 text-green-400" />
                                            <div>
                                                <p className="text-xs font-bold text-green-400">{appliedPromo.code}</p>
                                                <p className="text-[10px] text-green-400/70">
                                                    {appliedPromo.type === 'percentage' ? `${appliedPromo.value}% OFF` : `-${formatCurrency(appliedPromo.value)}`}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemovePromo}
                                            className="text-gray-500 hover:text-white text-xs underline"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                                {promoError && <p className="text-xs text-red-400 mt-1">{promoError}</p>}
                                {promoSuccess && <p className="text-xs text-green-400 mt-1">{promoSuccess}</p>}
                            </div>

                            {appliedPromo && (
                                <div className="flex justify-between text-green-400">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(finalTotal < effectiveSubtotal ? effectiveSubtotal - finalTotal : 0)}</span>
                                </div>
                            )}

                            <div className="border-t border-white/10 pt-3 mt-3 flex justify-between text-xl font-bold text-white">
                                <span>Total</span>
                                <span>{formatCurrency(finalTotal)}</span>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-900/20 text-red-400 text-sm rounded border border-red-900/50">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-accent hover:bg-yellow-600 text-black font-bold uppercase tracking-wide rounded shadow-lg shadow-yellow-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                `PAY ${formatCurrency(finalTotal)}`
                            )}
                        </button>

                        <p className="text-xs text-center text-gray-500 mt-4">
                            By placing this order, you agree to our Terms of Service and Privacy Policy.
                        </p>
                    </div>
                </div>
            </form>

            <OrderSuccessModal
                isOpen={showSuccessModal}
                onClose={() => {
                    setShowSuccessModal(false);
                    router.push('/');
                }}
                orderId={createdOrderId}
            />
        </div>
    );
}
