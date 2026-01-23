'use client';

import { useState, useEffect } from 'react';
import { X, Home, ShoppingBag, Package, Factory, Shield } from 'lucide-react';
import { Link, usePathname } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    role?: string;
}

export default function MobileMenu({ isOpen, onClose, role }: MobileMenuProps) {
    const pathname = usePathname();
    const t = useTranslations('Navbar');

    // Close menu when route changes
    useEffect(() => {
        onClose();
    }, [pathname, onClose]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const navLinks = [
        { href: '/', label: t('home'), icon: Home },
        { href: '/products', label: t('shop'), icon: ShoppingBag },
        { href: '/bundler', label: t('bundles'), icon: Package },
        { href: '/about', label: t('factory'), icon: Factory },
    ];

    const isAdmin = role === 'admin' || role === 'owner';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/80 z-[100]"
                        onClick={onClose}
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed top-0 right-0 h-full w-72 z-[101] flex flex-col shadow-2xl overflow-hidden"
                    >
                        {/* Solid Background - absolutely positioned */}
                        <div className="absolute inset-0 bg-black" style={{ backgroundColor: '#000000' }} />

                        {/* Header */}
                        <div className="relative flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900">
                            <span className="text-lg font-bold font-heading uppercase tracking-wider text-white">
                                Menu
                            </span>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Navigation Links */}
                        <nav className="relative flex-1 p-4 space-y-2 bg-zinc-900">
                            {navLinks.map((link) => {
                                const Icon = link.icon;
                                const isActive = pathname === link.href ||
                                    (link.href !== '/' && pathname.startsWith(link.href));

                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${isActive
                                            ? 'bg-accent text-white'
                                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        {link.label}
                                    </Link>
                                );
                            })}

                            {/* Admin Link */}
                            {isAdmin && (
                                <Link
                                    href="/admin/dashboard"
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${pathname.startsWith('/admin')
                                        ? 'bg-accent text-white'
                                        : 'text-accent hover:bg-accent/10'
                                        }`}
                                >
                                    <Shield className="h-5 w-5" />
                                    {t('adminPanel')}
                                </Link>
                            )}
                        </nav>

                        {/* Footer */}
                        <div className="relative p-4 border-t border-white/10 bg-zinc-900">
                            <p className="text-xs text-gray-500 text-center">
                                © 2024 RA Store
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
