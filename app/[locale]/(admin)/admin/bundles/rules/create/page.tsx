'use client';

import { useState } from 'react';
import { useRouter, Link } from '@/lib/navigation';
import { createDiscountRule } from '@/lib/actions/bundleActions';
import { ArrowLeft, Save } from 'lucide-react';

export default function CreateRulePage() {
    const [name, setName] = useState('');
    const [minQuantity, setMinQuantity] = useState(3);
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue] = useState(10);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = await createDiscountRule({
            name,
            minQuantity: Number(minQuantity),
            discountType,
            discountValue: Number(discountValue),
            isActive: true
        });

        if (result.success) {
            router.push('/admin/bundles');
            router.refresh();
        } else {
            alert('Failed: ' + result.error);
        }
    };

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/admin/bundles" className="text-gray-400 hover:text-white">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-3xl font-bold font-heading text-white">Create Discount Rule</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-zinc-900 border border-white/10 rounded-lg p-6 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">Rule Name</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded px-4 py-2 text-white focus:border-accent outline-none"
                        placeholder="e.g. Buy 3 get 10% Off"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">Minimum Quantity</label>
                    <input
                        type="number"
                        required
                        min="1"
                        value={minQuantity}
                        onChange={(e) => setMinQuantity(Number(e.target.value))}
                        className="w-full bg-black border border-white/10 rounded px-4 py-2 text-white focus:border-accent outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Number of items required in bundle to trigger discount.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-1">Discount Type</label>
                        <select
                            value={discountType}
                            onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                            className="w-full bg-black border border-white/10 rounded px-4 py-2 text-white focus:border-accent outline-none"
                        >
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Amount ($)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-1">Discount Value</label>
                        <input
                            type="number"
                            required
                            min="0"
                            step={discountType === 'percentage' ? '1' : '0.01'}
                            value={discountValue}
                            onChange={(e) => setDiscountValue(Number(e.target.value))}
                            className="w-full bg-black border border-white/10 rounded px-4 py-2 text-white focus:border-accent outline-none"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-white text-black py-3 rounded font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 uppercase tracking-wide mt-6"
                >
                    <Save className="h-5 w-5" />
                    Save Rule
                </button>
            </form>
        </div>
    );
}
