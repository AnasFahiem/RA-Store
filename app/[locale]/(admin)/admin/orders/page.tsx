import { supabase } from '@/lib/supabase';
import { Package, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/format';

async function getAllOrders() {
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*, users(email, name)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching admin orders:', error);
        return [];
    }
    return orders;
}

export default async function AdminOrdersPage() {
    const orders = await getAllOrders();
    const t = await getTranslations('Admin');

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-heading uppercase tracking-wide">{t('ordersTitle')}</h1>

            <div className="bg-zinc-900 border border-white/5 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-gray-400 uppercase text-xs tracking-wider">
                        <tr>
                            <th className="px-6 py-4">{t('table.id')}</th>
                            <th className="px-6 py-4">{t('table.customer')}</th>
                            <th className="px-6 py-4">{t('table.date')}</th>
                            <th className="px-6 py-4">{t('table.status')}</th>
                            <th className="px-6 py-4">{t('table.total')}</th>
                            <th className="px-6 py-4 text-right">{t('table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-mono text-sm text-gray-400">
                                    #{order.id.slice(0, 8)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-white font-medium">
                                        {(order.shipping_address as any)?.name || order.users?.name || 'Guest'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {(order.shipping_address as any)?.email || order.users?.email}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-400">
                                    {new Date(order.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium border
                    ${order.status === 'Delivered' ? 'bg-green-900/30 text-green-400 border-green-800' :
                                            order.status === 'Shipped' ? 'bg-blue-900/30 text-blue-400 border-blue-800' :
                                                'bg-yellow-900/30 text-yellow-400 border-yellow-800'}`}>
                                        {order.status === 'Delivered' && <CheckCircle className="h-3 w-3" />}
                                        {order.status === 'Shipped' && <Truck className="h-3 w-3" />}
                                        {order.status === 'Pending' && <AlertCircle className="h-3 w-3" />}
                                        {order.status}
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-bold text-accent">
                                    {formatCurrency(order.total_amount)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link href={`/admin/orders/${order.id}`} className="text-sm text-indigo-400 hover:text-indigo-300">
                                        Manage
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orders.length === 0 && (
                    <div className="text-center py-12">
                        <Package className="h-12 w-12 mx-auto text-gray-600 mb-2" />
                        <p className="text-gray-500">{t('noOrders')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
