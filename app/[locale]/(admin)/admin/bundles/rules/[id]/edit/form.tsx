'use client';

import { useState } from 'react';
import { useRouter, Link } from '@/lib/navigation';
import { updateDiscountRule } from '@/lib/actions/bundleActions';
import { ArrowLeft, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function EditRuleForm({ rule }: { rule: any }) {
    const t = useTranslations('Admin');
    const [name, setName] = useState(rule.name);
    const [minQuantity, setMinQuantity] = useState(rule.min_quantity);
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(rule.discount_type);
    const [discountValue, setDiscountValue] = useState(rule.discount_value);
    const [isActive, setIsActive] = useState(rule.is_active);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const result = await updateDiscountRule(rule.id, {
            name,
            minQuantity: Number(minQuantity),
            discountType,
            discountValue: Number(discountValue),
            isActive
        });

        if (result.success) {
            router.push('/admin/bundles');
            router.refresh();
        } else {
            alert('Failed: ' + result.error);
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/admin/bundles" className="text-gray-400 hover:text-white">
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h1 className="text-3xl font-bold font-heading text-white">{t('editRule')}</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-zinc-900 border border-white/10 rounded-lg p-6 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">{t('table.name')}</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded px-4 py-2 text-white focus:border-accent outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">{t('minQty', { qty: '' }).replace(':', '').trim()}</label>
                    <input
                        type="number"
                        required
                        min="1"
                        value={minQuantity}
                        onChange={(e) => setMinQuantity(Number(e.target.value))}
                        className="w-full bg-black border border-white/10 rounded px-4 py-2 text-white focus:border-accent outline-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-1">{t('discountType')}</label>
                        <select
                            value={discountType}
                            onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                            className="w-full bg-black border border-white/10 rounded px-4 py-2 text-white focus:border-accent outline-none"
                        >
                            <option value="percentage">{t('percentage')}</option>
                            <option value="fixed">{t('fixed')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-1">{t('discountValue')}</label>
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

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="isActive"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                    />
                    <label htmlFor="isActive" className="text-sm font-bold text-gray-400">{t('isActive')}</label>
                </div>

                <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full bg-white text-black py-3 rounded font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 uppercase tracking-wide mt-6 disabled:opacity-70"
                >
                    <Save className="h-5 w-5" />
                    {isSaving ? t('saving') : t('save')}
                </button>
            </form>
        </div>
    );
}
