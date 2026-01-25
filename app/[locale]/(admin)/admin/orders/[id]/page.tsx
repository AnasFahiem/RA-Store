import { createClient } from '@/lib/supabase/server';
import { updateOrderStatus } from '@/lib/actions/order-management';
import Link from 'next/link';
import { ArrowLeft, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { redirect } from 'next/navigation';

async function getOrder(id: string) {
    const supabase = await createClient();
    const { data: order } = await supabase
        .from('orders')
        .select('*, users(name, email)') // Keep the join for user info
        .eq('id', id)
        .single();
    return order;
}

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    // Await params first
    const { id } = await params;

    // Fetch order data
    const order = await getOrder(id);

    if (!order) {
        return <div>Order not found</div>;
    }

    // Server Action wrapper for form
    async function updateStatus(formData: FormData) {
        'use server';
        const newStatus = formData.get('status') as string;
        await updateOrderStatus(id, newStatus);
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/orders" className="p-2 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold font-heading uppercase tracking-wide">Order Details</h1>
                    <p className="text-gray-400 font-mono text-sm">ID: {order.id}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Details */}
                <div className="md:col-span-2 space-y-6">
                    {/* Items List (Placeholder as we don't have order_items table yet, assuming flat orders for now or JSON) */}
                    <div className="bg-zinc-900 border border-white/5 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Package className="h-5 w-5 text-accent" />
                            Order Items
                        </h3>
                        <div className="space-y-4">
                            {/* In a real app, map through order.items */}
                            <div className="flex items-center justify-between p-4 bg-black/40 rounded border border-white/5">
                                <div>
                                    <p className="font-medium text-white">Product Collection Bundle</p>
                                    <p className="text-sm text-gray-400">Qty: 1</p>
                                </div>
                                <p className="font-bold text-white">${order.total_amount}</p>
                            </div>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-zinc-900 border border-white/5 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Customer Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500 uppercase">Name</p>
                                <p className="text-white font-medium">{order.users?.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 uppercase">Email</p>
                                <p className="text-white font-medium">{order.users?.email}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar / Status */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-zinc-900 border border-white/5 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Truck className="h-5 w-5 text-accent" />
                            Status
                        </h3>

                        <div className="mb-6">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold border w-full justify-center
                                ${({
                                    'Delivered': 'bg-green-900/30 text-green-400 border-green-800',
                                    'Shipped': 'bg-blue-900/30 text-blue-400 border-blue-800'
                                } as Record<string, string>)[order.status] || 'bg-yellow-900/30 text-yellow-400 border-yellow-800'}
                            `}>
                                {order.status}
                            </div>
                        </div>

                        <form action={updateStatus} className="space-y-4">
                            <label className="block text-sm text-gray-400">Update Status</label>
                            <select name="status" defaultValue={order.status} className="w-full px-4 py-2 bg-black border border-white/10 rounded text-white focus:outline-none focus:border-accent">
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                            <button type="submit" className="w-full py-2 bg-accent text-white font-bold uppercase rounded hover:bg-white hover:text-black transition-colors">
                                Update
                            </button>
                        </form>
                    </div>

                    <div className="bg-zinc-900 border border-white/5 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-white mb-2">Summary</h3>
                        <div className="flex justify-between items-center pt-2 border-t border-white/5">
                            <span className="text-gray-400">Total</span>
                            <span className="text-xl font-bold text-accent">${order.total_amount}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
