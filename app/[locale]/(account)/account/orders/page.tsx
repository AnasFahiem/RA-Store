import { createClient } from '@/lib/supabase/server';
import { verifySession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

async function getOrders(userId: string) {
    const supabase = await createClient();
    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }

    return orders;
}

export default async function OrdersPage() {
    const session = await verifySession();
    if (!session) redirect('/auth/login');

    const orders = await getOrders(session.userId);

    return (
        <div>
            <h1 className="text-2xl font-bold font-heading uppercase mb-6">Order History</h1>

            {orders.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
                    <Package className="h-12 w-12 mx-auto text-gray-500 mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No orders yet</h3>
                    <p className="text-gray-400 mb-6">Build your gear collection today.</p>
                    <Link
                        href="/products"
                        className="inline-block px-6 py-3 bg-accent text-white font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors"
                    >
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div
                            key={order.id}
                            className="bg-black/40 border border-white/10 rounded-lg p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-accent/50 transition-colors"
                        >
                            <div>
                                <p className="text-sm text-gray-400 mb-1">
                                    Placed on {new Date(order.created_at).toLocaleDateString()}
                                </p>
                                <h3 className="font-bold text-lg text-white">
                                    Order #{order.id.slice(0, 8)}
                                </h3>
                                <div className="mt-2 flex gap-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'Delivered' ? 'bg-green-900/50 text-green-400 border border-green-800' :
                                            order.status === 'Shipped' ? 'bg-blue-900/50 text-blue-400 border border-blue-800' :
                                                'bg-yellow-900/50 text-yellow-400 border border-yellow-800'
                                        }`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <span className="text-xl font-bold text-accent">
                                    {formatCurrency(order.total_amount)}
                                </span>
                                <Link
                                    href={`/account/orders/${order.id}`}
                                    className="text-sm text-gray-300 hover:text-white underline decoration-gray-500 underline-offset-4"
                                >
                                    View Details
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
