'use client';

import { useState } from 'react';
import { useRouter, Link } from '@/lib/navigation';
import { createPromoCode, updatePromoCode } from '@/lib/actions/bundleActions';
import { ArrowLeft, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Props {
    promo?: any;
    isEdit?: boolean;
}

export default function PromoCodeForm({ promo, isEdit = false }: Props) {
    const t = useTranslations('Admin');
    const router = useRouter();

    const [code, setCode] = useState(promo?.code || '');
    const [description, setDescription] = useState(promo?.description || '');
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(promo?.discount_type || 'percentage');
    const [discountValue, setDiscountValue] = useState(promo?.discount_value || 0);
    const [maxUses, setMaxUses] = useState(promo?.max_uses || '');
    const [expiresAt, setExpiresAt] = useState(promo?.expires_at ? new Date(promo.expires_at).toISOString().slice(0, 16) : '');
    const [isActive, setIsActive] = useState(promo?.is_active ?? true);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const data = {
            code,
            description,
            discountType,
            discountValue: Number(discountValue),
            maxUses: maxUses ? Number(maxUses) : null,
            expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
            isActive
        };

        let result;
        if (isEdit && promo) {
            result = await updatePromoCode(promo.id, data);
        } else {
            result = await createPromoCode(data);
        }

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
                <h1 className="text-3xl font-bold font-heading text-white">
                    {isEdit ? t('editPromoCode') : t('createPromoCode')}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-zinc-900 border border-white/10 rounded-lg p-6 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">{t('promoCode')}</label>
                    <input
                        type="text"
                        required
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="w-full bg-black border border-white/10 rounded px-4 py-2 text-white focus:border-accent outline-none uppercase"
                        placeholder="e.g. SAVE20"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">{t('description')}</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded px-4 py-2 text-white focus:border-accent outline-none h-24 resize-none"
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

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-1">{t('maxUses')} <span className="text-xs font-normal text-gray-500">(Optional)</span></label>
                        <input
                            type="number"
                            min="1"
                            value={maxUses}
                            onChange={(e) => setMaxUses(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded px-4 py-2 text-white focus:border-accent outline-none"
                            placeholder="Unlimited"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-1">{t('expiresAt')} <span className="text-xs font-normal text-gray-500">(Optional)</span></label>
                        <input
                            type="datetime-local"
                            value={expiresAt}
                            onChange={(e) => setExpiresAt(e.target.value)}
                            className="w-full bg-black border border-white/10 rounded px-4 py-2 text-white focus:border-accent outline-none [color-scheme:dark]"
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
                    <label htmlFor="isActive" className="text-sm font-bold text-gray-400 cursor-pointer">{t('isActive')}</label>
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
