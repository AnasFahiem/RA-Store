import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import BundleBuilder from '@/components/bundler/BundleBuilder';
import { getAllProducts } from '@/lib/actions/products';
import { getDiscountRules, getAdminBundles } from '@/lib/actions/bundleActions';
import { Package } from 'lucide-react';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
    const t = await getTranslations({ locale, namespace: 'Bundler' });
    return {
        title: t('title') || 'Build Your Bundle',
        description: t('description') || 'Create your custom kit and save big.',
    };
}

export default async function BundlerPage() {
    const t = await getTranslations('Bundler');

    // Fetch all necessary data in parallel
    const [products, discountRules, adminBundles] = await Promise.all([
        getAllProducts(),
        getDiscountRules(),
        getAdminBundles()
    ]);

    return (
        <div className="min-h-screen bg-background pt-24 pb-12 relative overflow-hidden transition-colors duration-300">
            {/* Background Shapes */}
            <div className="absolute top-20 left-10 opacity-10 dark:opacity-5 animate-pulse text-foreground">
                <Package className="w-32 h-32 md:w-64 md:h-64 rotate-12" />
            </div>
            <div className="absolute bottom-20 right-10 opacity-10 dark:opacity-5 animate-pulse text-foreground delay-700">
                <Package className="w-40 h-40 md:w-80 md:h-80 -rotate-12" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold font-heading text-foreground mb-4 uppercase tracking-tighter">
                        {t('title') || 'Build Your Bundle'}
                    </h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                        {t('subtitle') || 'Select products for your custom kit. The more you add, the more you save!'}
                    </p>

                    {/* Discount Tier Visualizer */}
                    {discountRules.length > 0 && (
                        <div className="mt-8 flex flex-wrap justify-center gap-4">
                            {discountRules.slice(0, 3).map((rule: any) => (
                                <div key={rule.id} className="bg-secondary/50 border border-border rounded-full px-4 py-1 flex items-center gap-2 text-sm text-foreground">
                                    <Package className="h-4 w-4 text-accent" />
                                    <span>
                                        Buy <b>{rule.min_quantity}+</b> get
                                        <b className="text-accent ml-1">
                                            {rule.discount_type === 'percentage'
                                                ? `${rule.discount_value}%`
                                                : `$${rule.discount_value}`} Off
                                        </b>
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Builder Application */}
                <BundleBuilder
                    products={products}
                    discountRules={discountRules}
                    adminBundles={adminBundles}
                />
            </div>
        </div>
    );
}
