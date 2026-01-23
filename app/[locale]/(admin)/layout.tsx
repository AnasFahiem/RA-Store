import { redirect } from '@/lib/navigation';
import { verifySession } from '@/lib/auth/session';
import { Link } from '@/lib/navigation';
import { LayoutDashboard, Package, ShoppingCart, LogOut, ShoppingBag, Users, Layers, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logout } from '@/lib/actions/auth';
import AdminLanguageToggle from '@/components/admin/AdminLanguageToggle';
import { getTranslations } from 'next-intl/server';

// Check if user is admin against RBAC policy
async function isAdmin(userId: string) {
    const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

    return user?.role === 'admin' || user?.role === 'owner';
}

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await verifySession();

    if (!session) {
        redirect({ href: '/auth/login', locale: 'en' }); // Fallback or use middleware redirect
    }

    const admin = await isAdmin(session.userId);
    if (!admin) {
        redirect({ href: '/', locale: 'en' });
    }

    const t = await getTranslations('Admin');

    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Admin Sidebar */}
            <aside className="w-64 bg-zinc-900 border-r border-white/5 flex flex-col fixed h-full z-20 ltr:left-0 rtl:right-0">
                <div className="p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold font-heading uppercase tracking-wider text-accent">{t('panel')}</h2>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link
                        href="/admin/dashboard"
                        className="flex items-center gap-3 px-4 py-3 rounded-md text-gray-400 hover:bg-black/50 hover:text-white transition-colors"
                    >
                        <LayoutDashboard className="h-5 w-5" />
                        {t('dashboard.label')}
                    </Link>
                    <Link
                        href="/admin/orders"
                        className="flex items-center gap-3 px-4 py-3 rounded-md text-gray-400 hover:bg-black/50 hover:text-white transition-colors"
                    >
                        <ShoppingCart className="h-5 w-5" />
                        {t('orders')}
                    </Link>
                    <Link
                        href="/admin/inventory"
                        className="flex items-center gap-3 px-4 py-3 rounded-md text-gray-400 hover:bg-black/50 hover:text-white transition-colors"
                    >
                        <Package className="h-5 w-5" />
                        {t('inventory')}
                    </Link>
                    <Link
                        href="/admin/hero"
                        className="flex items-center gap-3 px-4 py-3 rounded-md text-gray-400 hover:bg-black/50 hover:text-white transition-colors"
                    >
                        <ImageIcon className="h-5 w-5" />
                        Hero Slider
                    </Link>
                    <Link
                        href="/admin/bundles"
                        className="flex items-center gap-3 px-4 py-3 rounded-md text-gray-400 hover:bg-black/50 hover:text-white transition-colors"
                    >
                        <Layers className="h-5 w-5" />
                        {t('bundles')}
                    </Link>
                    <Link
                        href="/admin/users"
                        className="flex items-center gap-3 px-4 py-3 rounded-md text-gray-400 hover:bg-black/50 hover:text-white transition-colors"
                    >
                        <Users className="h-5 w-5" />
                        {t('users')}
                    </Link>

                    <AdminLanguageToggle />

                    <div className="pt-4 mt-4 border-t border-white/5">
                        <Link
                            href="/"
                            className="flex items-center gap-3 px-4 py-3 rounded-md text-accent hover:bg-black/50 hover:text-white transition-colors"
                        >
                            <ShoppingBag className="h-5 w-5" />
                            {t('backToShop')}
                        </Link>
                    </div>
                </nav>

                <div className="p-4 border-t border-white/5">
                    <form action={logout}>
                        <button type="submit" className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-md font-medium text-red-400 hover:bg-red-900/10 transition-colors">
                            <LogOut className="h-5 w-5" />
                            {t('exit')}
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ltr:ml-64 rtl:mr-64 p-8">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
