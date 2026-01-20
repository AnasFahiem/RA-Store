import { supabase } from '@/lib/supabase';
import { Package, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

async function getStats() {
    const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });

    // Calculate total revenue
    const { data: orders } = await supabase.from('orders').select('total_amount');
    const totalRevenue = orders?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;

    return {
        orderCount: orderCount || 0,
        productCount: productCount || 0,
        userCount: userCount || 0,
        totalRevenue
    };
}

export default async function AdminDashboard() {
    const stats = await getStats();

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold font-heading uppercase tracking-wide">Dashboard Overview</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-zinc-900 border border-white/5 p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Total Revenue</p>
                            <h3 className="text-3xl font-bold text-white mt-1">{formatCurrency(stats.totalRevenue)}</h3>
                        </div>
                        <div className="p-3 bg-green-500/10 rounded-full text-green-400">
                            <DollarSign className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Total Orders</p>
                            <h3 className="text-3xl font-bold text-white mt-1">{stats.orderCount}</h3>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-full text-blue-400">
                            <ShoppingCart className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Products</p>
                            <h3 className="text-3xl font-bold text-white mt-1">{stats.productCount}</h3>
                        </div>
                        <div className="p-3 bg-accent/10 rounded-full text-accent">
                            <Package className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400 font-medium uppercase tracking-wider">Customers</p>
                            <h3 className="text-3xl font-bold text-white mt-1">{stats.userCount}</h3>
                        </div>
                        <div className="p-3 bg-purple-500/10 rounded-full text-purple-400">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Placeholder for Recent Activity */}
            <div className="bg-zinc-900 border border-white/5 rounded-lg p-6 min-h-[300px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Sales analytic charts coming in V2</p>
                </div>
            </div>
        </div>
    );
}
