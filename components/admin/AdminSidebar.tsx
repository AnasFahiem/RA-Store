'use client';

import { useState } from 'react';
import { Link, usePathname } from '@/lib/navigation';
import { LayoutDashboard, Package, ShoppingCart, LogOut, ShoppingBag, Users, Layers, Image as ImageIcon, Menu, X } from 'lucide-react';
import { logout } from '@/lib/actions/auth';
import AdminLanguageToggle from './AdminLanguageToggle';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminSidebarProps {
    translations: {
        panel: string;
        dashboard: string;
        orders: string;
        inventory: string;
        bundles: string;
        users: string;
        backToShop: string;
        exit: string;
    };
}

function SidebarContent({ translations, pathname, setIsOpen }: {
    readonly translations: any;
    readonly pathname: string;
    readonly setIsOpen: (open: boolean) => void;
}) {
    const navLinks = [
        { href: '/admin/dashboard', label: translations.dashboard, icon: LayoutDashboard },
        { href: '/admin/orders', label: translations.orders, icon: ShoppingCart },
        { href: '/admin/inventory', label: translations.inventory, icon: Package },
        { href: '/admin/hero', label: 'Hero Slider', icon: ImageIcon },
        { href: '/admin/bundles', label: translations.bundles, icon: Layers },
        { href: '/admin/users', label: translations.users, icon: Users },
    ];

    return (
        <>
            <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-bold font-heading uppercase tracking-wider text-accent">
                    {translations.panel}
                </h2>
                <button
                    onClick={() => setIsOpen(false)}
                    className="md:hidden p-2 text-gray-400 hover:text-white"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <nav className="flex-1 p-3 md:p-4 space-y-1 md:space-y-2 overflow-y-auto">
                {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname.startsWith(link.href);

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-md text-sm md:text-base transition-colors ${isActive
                                ? 'bg-accent/20 text-accent'
                                : 'text-gray-400 hover:bg-black/50 hover:text-white'
                                }`}
                        >
                            <Icon className="h-4 w-4 md:h-5 md:w-5" />
                            {link.label}
                        </Link>
                    );
                })}

                <AdminLanguageToggle />

                <div className="pt-3 md:pt-4 mt-3 md:mt-4 border-t border-white/5">
                    <Link
                        href="/"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-md text-sm md:text-base text-accent hover:bg-black/50 hover:text-white transition-colors"
                    >
                        <ShoppingBag className="h-4 w-4 md:h-5 md:w-5" />
                        {translations.backToShop}
                    </Link>
                </div>
            </nav>

            <div className="p-3 md:p-4 border-t border-white/5">
                <form action={logout}>
                    <button
                        type="submit"
                        className="w-full flex items-center gap-3 text-left px-3 md:px-4 py-2.5 md:py-3 rounded-md text-sm md:text-base font-medium text-red-400 hover:bg-red-900/10 transition-colors"
                    >
                        <LogOut className="h-4 w-4 md:h-5 md:w-5" />
                        {translations.exit}
                    </button>
                </form>
            </div>
        </>
    );
}

export default function AdminSidebar({ translations }: { readonly translations: AdminSidebarProps['translations'] }) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    return (
        <>
            {/* Mobile Header with Menu Button */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-zinc-900 border-b border-white/5 px-4 py-3 flex items-center justify-between">
                <h2 className="text-lg font-bold font-heading uppercase tracking-wider text-accent">
                    {translations.panel}
                </h2>
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 text-gray-400 hover:text-white"
                >
                    <Menu className="h-6 w-6" />
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="md:hidden fixed inset-0 bg-black/60 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Mobile Sidebar */}
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="md:hidden fixed top-0 left-0 h-full w-64 bg-zinc-900 z-50 flex flex-col"
                        >
                            <SidebarContent translations={translations} pathname={pathname} setIsOpen={setIsOpen} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar - Always visible */}
            <aside className="hidden md:flex w-64 bg-zinc-900 border-r border-white/5 flex-col fixed h-full z-20 ltr:left-0 rtl:right-0">
                <SidebarContent translations={translations} pathname={pathname} setIsOpen={setIsOpen} />
            </aside>
        </>
    );
}
