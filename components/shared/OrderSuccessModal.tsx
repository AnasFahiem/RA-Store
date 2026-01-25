'use client';

import { CheckCircle, Mail, ArrowRight, X } from 'lucide-react';
import { Link } from '@/lib/navigation';
import { useEffect, useState } from 'react';

interface OrderSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
}

export default function OrderSuccessModal({ isOpen, onClose, orderId }: OrderSuccessModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            {/* Backdrop */}
            <button
                type="button"
                className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer w-full h-full border-none p-0"
                onClick={onClose}
                aria-label="Close modal"
            />

            {/* Modal Content */}
            <div className={`relative bg-zinc-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center space-y-6">
                    {/* Success Icon */}
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-green-500/20">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold font-heading text-white uppercase tracking-wide">
                            Order Confirmed!
                        </h2>
                        <p className="text-gray-400 text-sm">
                            Thank you for your purchase. Your order has been placed successfully.
                        </p>
                        <div className="py-2">
                            <span className="bg-white/5 py-1 px-3 rounded text-xs font-mono text-gray-400 border border-white/5">
                                Order ID: #{orderId.slice(0, 8)}
                            </span>
                        </div>
                    </div>

                    {/* Action Items */}
                    <div className="bg-white/5 rounded-xl p-4 text-left space-y-4 border border-white/5">
                        <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Mail className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="text-white font-medium text-sm">Check your email</h4>
                                <p className="text-gray-500 text-xs mt-0.5">We've sent a confirmation email with all the details.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <ArrowRight className="w-4 h-4 text-accent" />
                            </div>
                            <div>
                                <h4 className="text-white font-medium text-sm">Track your order</h4>
                                <p className="text-gray-500 text-xs mt-0.5">You can view your order status in the dashboard.</p>
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="grid grid-cols-1 gap-3 pt-2">
                        <Link
                            href="/account/orders"
                            className="w-full py-3 bg-accent text-black font-bold rounded-lg hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2"
                        >
                            Track Order
                            <ArrowRight className="w-4 h-4" />
                        </Link>

                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-white/5 text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
                        >
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
