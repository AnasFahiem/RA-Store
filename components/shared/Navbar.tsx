'use client';

import { Link, usePathname, useRouter } from '@/lib/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ShoppingBag, User, Menu, Globe, Sun, Moon } from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function Navbar({ role, userName }: { role?: string; userName?: string }) {
    const { totalItems, openCart } = useCart();
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('Navbar');
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const toggleLocale = () => {
        const nextLocale = locale === 'en' ? 'ar' : 'en';
        router.replace(pathname, { locale: nextLocale });
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <nav className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-md border-b border-white/10 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="relative w-10 h-10">
                                <Image src="/logo.png" alt="RA Store Logo" fill className="object-contain invert-0" />
                            </div>
                            <span className="text-2xl font-bold font-heading uppercase tracking-tighter group-hover:text-accent transition-colors hidden sm:block text-white">
                                RA STORE
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:ml-6 md:flex md:space-x-8">
                        <Link href="/products" className="text-gray-300 hover:text-accent px-3 py-2 text-sm font-medium transition-colors uppercase tracking-wide">
                            {t('shop')}
                        </Link>
                        <Link href="/bundler" className="text-gray-300 hover:text-accent px-3 py-2 text-sm font-medium transition-colors uppercase tracking-wide">
                            {t('bundles')}
                        </Link>
                        <Link href="/about" className="text-gray-300 hover:text-accent px-3 py-2 text-sm font-medium transition-colors uppercase tracking-wide">
                            {t('factory')}
                        </Link>
                        {role === 'admin' && (
                            <Link href="/admin/dashboard" className="text-accent hover:text-primary px-3 py-2 text-sm font-bold transition-colors uppercase tracking-wide">
                                {t('adminPanel')}
                            </Link>
                        )}
                    </div>

                    {/* Icons */}
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center gap-4">
                            {userName ? (
                                <div className="flex items-center gap-4">
                                    <Link href="/account" className="flex items-center gap-2 text-gray-400 hover:text-accent transition-colors">
                                        <span className="sr-only">{t('account')}</span>
                                        <User className="h-6 w-6" />
                                        <span className="text-sm font-medium hidden sm:block">{userName}</span>
                                    </Link>
                                    <button
                                        onClick={async () => {
                                            const { logout } = await import('@/lib/actions/auth');
                                            await logout();
                                        }}
                                        className="text-xs text-red-500 hover:text-red-400 font-bold uppercase tracking-wide border border-red-500/30 px-2 py-1 rounded"
                                    >
                                        Log Out
                                    </button>
                                </div>
                            ) : (
                                <Link href="/auth/login" className="flex items-center gap-2 text-gray-400 hover:text-accent transition-colors">
                                    <User className="h-6 w-6" />
                                    <span className="text-sm font-medium hidden sm:block">Sign In</span>
                                </Link>
                            )}
                        </div>
                        <button onClick={openCart} className="group -m-2 flex items-center p-2 text-gray-400 hover:text-accent transition-colors relative">
                            <span className="sr-only">{t('cart')}</span>
                            <div className="relative">
                                <ShoppingBag className="h-6 w-6 flex-shrink-0" />
                                {totalItems > 0 && (
                                    <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">
                                        {totalItems}
                                    </span>
                                )}
                            </div>
                        </button>

                        {/* Theme Toggle */}
                        {mounted && (
                            <button
                                onClick={toggleTheme}
                                className="text-gray-400 hover:text-accent p-2 transition-colors relative group flex items-center gap-1"
                                aria-label="Toggle Theme"
                            >
                                {theme === 'dark' ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                            </button>
                        )}

                        <button
                            onClick={toggleLocale}
                            className="text-gray-400 hover:text-accent p-2 transition-colors relative group flex items-center gap-1"
                            aria-label="Translate"
                        >
                            <Globe className="h-6 w-6" />
                            <span className="text-xs font-medium uppercase">{locale === 'en' ? 'EN' : 'AR'}</span>
                        </button>
                        <div className="md:hidden">
                            <button className="text-gray-400 hover:text-accent p-2">
                                <Menu className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
