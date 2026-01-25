'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, Link } from '@/lib/navigation';
import { getAllProducts } from '@/lib/actions/products';
import { getBundleById, updateBundle } from '@/lib/actions/bundleActions';
import Image from 'next/image';
import { Plus, Minus, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

export default function EditBundlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [products, setProducts] = useState<any[]>([]);
    const [selectedItems, setSelectedItems] = useState<{ productId: string; quantity: number }[]>([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [priceOverride, setPriceOverride] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const loadData = async () => {
            const [productsData, bundleData] = await Promise.all([
                getAllProducts(),
                getBundleById(id)
            ]);

            setProducts(productsData);

            if (bundleData) {
                setName(bundleData.name || '');
                setDescription(bundleData.description || '');
                setImageUrl(bundleData.image || '');
                setPriceOverride(bundleData.price_override?.toString() || '');

                // Convert bundle items to selected items format
                const items = bundleData.items?.map((item: any) => ({
                    productId: item.product.id,
                    quantity: item.quantity
                })) || [];
                setSelectedItems(items);
            }

            setLoading(false);
        };

        loadData();
    }, [id]);

    const addItem = (productId: string) => {
        setSelectedItems(prev => {
            const existing = prev.find(p => p.productId === productId);
            if (existing) {
                return prev.map(p => p.productId === productId ? { ...p, quantity: p.quantity + 1 } : p);
            }
            return [...prev, { productId, quantity: 1 }];
        });
    };

    const updateQuantity = (productId: string, delta: number) => {
        setSelectedItems(prev => {
            return prev.map(p => {
                if (p.productId === productId) {
                    const newQty = p.quantity + delta;
                    return newQty > 0 ? { ...p, quantity: newQty } : null;
                }
                return p;
            }).filter(Boolean) as { productId: string; quantity: number }[];
        });
    };

    const calculatedTotal = selectedItems.reduce((sum, item) => {
        const product = products.find(p => p.id === item.productId);
        return sum + (product?.price || 0) * item.quantity;
    }, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedItems.length === 0) return;

        setSaving(true);
        const result = await updateBundle(id, {
            name,
            description,
            type: 'admin_fixed',
            items: selectedItems,
            image: imageUrl || null,
            priceOverride: priceOverride ? Number.parseFloat(priceOverride) : undefined
        });

        if (result.success) {
            router.push('/admin/bundles');
            router.refresh();
        } else {
            alert('Failed: ' + result.error);
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-8 text-white gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading bundle...
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/admin/bundles" className="text-gray-400 hover:text-white">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-3xl font-bold font-heading text-white">Edit Bundle</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Selection */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4 text-white">Available Products</h2>
                    <div className="grid grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {products.map(product => (
                            <div key={product.id} className="bg-black/40 border border-white/10 rounded p-3 flex flex-col">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="relative w-10 h-10 bg-zinc-800 rounded flex-shrink-0">
                                        {product.image && <Image src={product.image} fill className="object-cover rounded" alt={product.name} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-white text-xs truncate">{product.name}</p>
                                        <p className="text-xs text-gray-500">{formatCurrency(product.price)}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => addItem(product.id)}
                                    className="mt-auto w-full bg-white/10 hover:bg-white/20 text-white py-1 rounded text-xs font-bold"
                                >
                                    Add
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bundle Configuration */}
                <form onSubmit={handleSubmit} className="bg-zinc-900 border border-white/10 rounded-lg p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-1">Bundle Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded px-4 py-2 text-white focus:border-accent outline-none"
                            placeholder="e.g. Starter Power Kit"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded px-4 py-2 text-white focus:border-accent outline-none h-24"
                            placeholder="Bundle details..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-1">Image URL (Optional)</label>
                        <input
                            type="text"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded px-4 py-2 text-white focus:border-accent outline-none"
                            placeholder="https://..."
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate a collage.</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-gray-400 mb-2">Selected Items</h3>
                        <div className="space-y-2 mb-4 bg-black/20 p-2 rounded max-h-[200px] overflow-y-auto">
                            {selectedItems.length === 0 ? (
                                <p className="text-xs text-gray-600 italic">No items selected</p>
                            ) : (
                                selectedItems.map(item => {
                                    const product = products.find(p => p.id === item.productId);
                                    if (!product) return null;
                                    return (
                                        <div key={item.productId} className="flex justify-between items-center text-sm text-gray-300">
                                            <span>{product.name}</span>
                                            <div className="flex items-center gap-2">
                                                <button type="button" onClick={() => updateQuantity(item.productId, -1)} className="text-gray-500 hover:text-white"><Minus className="h-3 w-3" /></button>
                                                <span>{item.quantity}</span>
                                                <button type="button" onClick={() => updateQuantity(item.productId, 1)} className="text-gray-500 hover:text-white"><Plus className="h-3 w-3" /></button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-4">
                        <div className="flex justify-between text-gray-400 mb-2">
                            <span>Calculated Value</span>
                            <span>{formatCurrency(calculatedTotal)}</span>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-accent mb-1">Price Override (Optional)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={priceOverride}
                                onChange={(e) => setPriceOverride(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded px-4 py-2 text-white focus:border-accent outline-none"
                                placeholder={`Leave empty to use ${formatCurrency(calculatedTotal)}`}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={selectedItems.length === 0 || saving}
                        className="w-full bg-accent text-black py-3 rounded font-bold hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 uppercase tracking-wide disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        {saving ? 'Saving...' : 'Update Bundle'}
                    </button>
                </form>
            </div>
        </div>
    );
}
