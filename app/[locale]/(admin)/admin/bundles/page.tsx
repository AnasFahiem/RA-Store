import { getDiscountRules, getAdminBundles } from '@/lib/actions/bundleActions';
import { formatCurrency } from '@/lib/utils/format';
import { Plus, Tag, Layers, Edit } from 'lucide-react';
import { Link } from '@/lib/navigation';
import { getTranslations } from 'next-intl/server';
import { DeleteBundleButton } from './delete-button';

export default async function BundlesPage() {
    // These will fail if DB tables don't exist, so we handle gracefully or show error if empty
    let discountRules = [];
    let bundles = [];
    const t = await getTranslations('Admin');

    try {
        discountRules = await getDiscountRules();
        bundles = await getAdminBundles();
    } catch (e) {
        console.error('Failed to load bundles data:', e);
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold font-heading text-white">{t('bundlesTitle')}</h1>
            </div>

            {/* Discount Rules Section */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-accent flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        {t('discountRules')}
                    </h2>
                    <Link href="/admin/bundles/rules/create" className="bg-white text-black px-4 py-2 rounded font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm">
                        <Plus className="h-4 w-4" />
                        {t('addRule')}
                    </Link>
                </div>

                {discountRules.length === 0 ? (
                    <p className="text-gray-500 italic">{t('noRules')}</p>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {discountRules.map((rule: any) => (
                            <div key={rule.id} className="bg-black/40 border border-white/10 rounded p-4">
                                <h3 className="font-bold text-white max-w-[12rem] truncate" title={rule.name}>{rule.name}</h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    {rule.discount_type === 'percentage'
                                        ? `${rule.discount_value}% ${t('off')}`
                                        : `${formatCurrency(rule.discount_value)} ${t('off')}`}
                                </p>
                                <div className="mt-2 text-xs text-gray-500">
                                    {t('minQty', { qty: rule.min_quantity })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Admin Bundles Section */}
            <div className="bg-zinc-900/50 border border-white/5 rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-accent flex items-center gap-2">
                        <Layers className="h-5 w-5" />
                        {t('preMadeBundles')}
                    </h2>
                    <Link href="/admin/bundles/create" className="bg-accent text-black px-4 py-2 rounded font-bold hover:bg-accent/90 transition-colors flex items-center gap-2 text-sm">
                        <Plus className="h-4 w-4" />
                        {t('createBundle')}
                    </Link>
                </div>

                {bundles.length === 0 ? (
                    <p className="text-gray-500 italic">{t('noBundles')}</p>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {bundles.map((bundle: any) => (
                            <div key={bundle.id} className="bg-black/40 border border-white/10 rounded p-4 group">
                                <h3 className="font-bold text-white text-lg">{bundle.name}</h3>
                                <p className="text-sm text-gray-400 mt-1 line-clamp-2">{bundle.description}</p>

                                <div className="mt-4 space-y-2">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('items')}</h4>
                                    <ul className="text-sm text-gray-300 space-y-1">
                                        {bundle.items?.map((item: any) => (
                                            <li key={item.product.id} className="flex justify-between">
                                                <span>{item.product.name}</span>
                                                <span className="text-gray-500">x{item.quantity}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                                    {bundle.price_override ? (
                                        <span className="text-accent font-bold text-lg">{formatCurrency(bundle.price_override)}</span>
                                    ) : (
                                        <span className="text-gray-500 text-sm">{t('calculatedPrice')}</span>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <Link
                                            href={`/admin/bundles/${bundle.id}/edit`}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                                            title="Edit Bundle"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Link>
                                        <DeleteBundleButton bundleId={bundle.id} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
