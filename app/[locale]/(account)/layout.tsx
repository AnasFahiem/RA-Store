import { redirect } from '@/lib/navigation';
import { verifySession } from '@/lib/auth/session';
import { Link } from '@/lib/navigation';
import { User, Package, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { logout } from '@/lib/actions/auth';

export default async function AccountLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations('Account');
    const tNav = await getTranslations('Navbar');
    const tCommon = await getTranslations('Common');
    const session = await verifySession();

    if (!session) {
        redirect({ href: '/auth/login', locale });
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="md:col-span-1">
                    <nav className="space-y-2">
                        {session.role === 'admin' && (
                            <Link
                                href="/admin"
                                className="flex items-center gap-3 px-4 py-3 rounded-md font-bold text-accent bg-accent/10 border border-accent/20 hover:bg-accent hover:text-black transition-colors mb-4"
                            >
                                <LayoutDashboard className="h-5 w-5" />
                                {tNav('adminPanel')}
                            </Link>
                        )}
                        <Link
                            href="/account"
                            className="flex items-center gap-3 px-4 py-3 rounded-md font-medium text-gray-300 hover:bg-zinc-900 hover:text-white transition-colors"
                        >
                            <User className="h-5 w-5" />
                            {t('overview')}
                        </Link>
                        <Link
                            href="/account/orders"
                            className="flex items-center gap-3 px-4 py-3 rounded-md font-medium text-gray-300 hover:bg-zinc-900 hover:text-white transition-colors"
                        >
                            <Package className="h-5 w-5" />
                            {t('orders')}
                        </Link>
                        <Link
                            href="/account/profile"
                            className="flex items-center gap-3 px-4 py-3 rounded-md font-medium text-gray-300 hover:bg-zinc-900 hover:text-white transition-colors"
                        >
                            <Settings className="h-5 w-5" />
                            {t('profile')}
                        </Link>

                        <div className="pt-4 border-t border-zinc-800 mt-4 mb-2">
                            <Link
                                href="/"
                                className="flex items-center gap-3 px-4 py-3 rounded-md font-medium text-accent hover:bg-zinc-900 hover:text-white transition-colors"
                            >
                                <span className="h-5 w-5 flex items-center justify-center font-bold">←</span>
                                {tCommon('backToShop')}
                            </Link>
                        </div>
                        <form action={logout} className="pt-4 border-t border-zinc-800 mt-4">
                            <button type="submit" className="w-full flex items-center gap-3 text-left px-4 py-3 rounded-md font-medium text-red-400 hover:bg-zinc-900 transition-colors">
                                <LogOut className="h-5 w-5" />
                                {t('signOut') || 'Sign Out'}
                            </button>
                        </form>
                    </nav>
                </div>

                {/* Content */}
                <div className="md:col-span-3 bg-zinc-900/40 backdrop-blur-sm p-6 md:p-8 rounded-xl border border-white/5">
                    {children}
                </div>
            </div>
        </div>
    );
}
