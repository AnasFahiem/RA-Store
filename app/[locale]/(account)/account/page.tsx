import { createClient } from '@/lib/supabase/server';
import { verifySession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Package, User, Clock, ChevronRight } from 'lucide-react';

async function getUserData(userId: string) {
    const supabase = await createClient();
    const { data: user } = await supabase.from('users').select('name').eq('id', userId).single();
    const { data: orders } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(3);

    return { user, orders: orders || [] };
}

export default async function AccountOverviewPage() {
    const session = await verifySession();
    if (!session) redirect('/auth/login');

    const { user, orders } = await getUserData(session.userId);

    const t = await getTranslations('Account');

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-heading uppercase text-white">
                        {t('welcome')}, <span className="text-accent">{user?.name}</span>
                    </h1>
                    <p className="text-gray-400 mt-1">Here's what's happening with your gear.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-black/40 border border-white/10 p-6 rounded-lg">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-accent/10 rounded-full text-accent">
                            <Package className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">{t('totalOrders')}</p>
                            <p className="text-2xl font-bold text-white">{orders.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-black/40 border border-white/10 p-6 rounded-lg">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-full text-blue-400">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Last Active</p>
                            <p className="text-2xl font-bold text-white">Just now</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Orders */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold font-heading uppercase">{t('recentOrders')}</h2>
                    <Link href="/account/orders" className="text-sm text-accent hover:text-white transition-colors flex items-center gap-1">
                        View All <ChevronRight className="h-4 w-4" />
                    </Link>
                </div>

                {orders.length > 0 ? (
                    <div className="bg-black/40 border border-white/10 rounded-lg divide-y divide-white/5">
                        {orders.map((order) => (
                            <div key={order.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div>
                                    <p className="font-medium text-white">Order #{order.id.slice(0, 8)}</p>
                                    <p className="text-sm text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    {(() => {
                                        const statusClasses = order.status === 'Delivered'
                                            ? 'bg-green-900/30 text-green-400'
                                            : order.status === 'Shipped'
                                                ? 'bg-blue-900/30 text-blue-400'
                                                : 'bg-yellow-900/30 text-yellow-400';
                                        return (
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses}`}>
                                                {order.status}
                                            </span>
                                        );
                                    })()}
                                    <span className="text-white font-medium">${order.total_amount}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-black/40 border border-white/10 rounded-lg">
                        <p className="text-gray-400">{t('noRecent')}</p>
                        <Link href="/products" className="text-accent hover:underline mt-2 inline-block">{t('startShopping')}</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
