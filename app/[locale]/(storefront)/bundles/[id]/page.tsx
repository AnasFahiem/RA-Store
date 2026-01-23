
import { getBundleById } from '@/lib/actions/bundleActions';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils/format';
import { ShoppingBag, ArrowLeft, Check, Package } from 'lucide-react';
import { Link } from '@/lib/navigation';
import AddBundleButton from '@/components/storefront/AddBundleButton';
import BundleImageGallery from '@/components/storefront/BundleImageGallery';

import { getTranslations } from 'next-intl/server';

// Next.js 15: params is a Promise
export default async function BundleDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    console.log('[BundleDetailsPage] Rendered with ID:', params.id);
    const bundle = await getBundleById(params.id);
    const t = await getTranslations('Bundler');
    const tCommon = await getTranslations('Common');

    if (!bundle) {
        console.error('[BundleDetailsPage] Bundle NOT FOUND for ID:', params.id);
        return notFound();
    }
    console.log('[BundleDetailsPage] Found Bundle:', bundle.name);

    // Calculate totals
    const calculatedPrice = bundle.items.reduce((sum: number, item: any) => sum + (item.product.base_price * item.quantity), 0);
    const price = bundle.price_override ?? calculatedPrice;
    const savings = calculatedPrice - price;

    // Parse Images for Collage
    const collageImages = bundle.items.slice(0, 4).map((i: any) => {
        const rawImages = i.product.images;
        let img = '/placeholder.jpg';
        if (Array.isArray(rawImages) && rawImages.length > 0) img = rawImages[0];
        else if (typeof rawImages === 'string') {
            try {
                const parsed = JSON.parse(rawImages);
                if (Array.isArray(parsed)) img = parsed[0];
                else if (parsed.startsWith('http')) img = parsed;
            } catch { if (rawImages.startsWith('http')) img = rawImages; }
        }
        return img;
    });

    return (
        <div className="bg-background min-h-screen text-foreground py-8">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <Link href="/products" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {tCommon('backToShop')}
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
                    {/* Left: Image Gallery */}
                    <div className="h-fit sticky top-24">
                        <BundleImageGallery
                            mainImage={bundle.image}
                            itemImages={collageImages}
                            bundleName={bundle.name}
                        />
                    </div>

                    {/* Right: Details (Recoil Style) */}
                    <div className="flex flex-col h-full space-y-6">
                        {/* Header Section */}
                        <div className="space-y-4 border-b border-border pb-6">
                            <div className="flex items-center gap-3">
                                <span className="bg-destructive text-destructive-foreground px-2 py-1 rounded-sm text-xs font-bold uppercase tracking-wider">
                                    {t('bundleLabel')}
                                </span>
                                {bundle.is_active && (
                                    <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-sm text-xs font-bold uppercase tracking-wider">
                                        {t('inStock')}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-4xl md:text-5xl font-extrabold font-heading uppercase tracking-tight text-foreground leading-none">
                                {bundle.name}
                            </h1>

                            <div className="flex items-baseline gap-4">
                                <span className="text-3xl font-bold text-foreground">{formatCurrency(price)}</span>
                                {savings > 0 && (
                                    <span className="text-xl text-muted-foreground line-through decoration-destructive/50">
                                        {formatCurrency(calculatedPrice)}
                                    </span>
                                )}
                            </div>

                            <p className="text-base text-muted-foreground leading-relaxed">
                                {bundle.description || "A curated selection of premium gear to elevate your training."}
                            </p>
                        </div>

                        {/* Included Items Section */}
                        <div className="pt-2">
                            <h4 className="text-xl font-semibold font-heading uppercase tracking-tight text-foreground mb-4">
                                {t('includedInBundle')}
                            </h4>
                            <div className="space-y-3">
                                {bundle.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-4 bg-muted/40 p-3 rounded-md border border-border">
                                        <div className="relative w-14 h-14 bg-background rounded-sm overflow-hidden flex-shrink-0 border border-border/50">
                                            {/* Reuse simpler logic for image parsing since we pre-calculated collageImages */}
                                            {/* Note: itemImages matches index of items. But earlier logic didn't pass full itemImages list to this map scope easily unless recalculated or passed.
                                                Simpler: Use collageImages[idx] assuming order is same.
                                            */}
                                            <Image
                                                src={collageImages[idx] || '/placeholder.jpg'}
                                                alt={item.product.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground text-sm uppercase">{item.product.name}</p>
                                            <p className="text-xs text-muted-foreground">{t('quantity')}: {item.quantity}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-6 mt-auto">
                            <AddBundleButton
                                bundleId={bundle.id}
                                price={price}
                                bundleName={bundle.name}
                                items={bundle.items}
                            />

                            {/* Trust Badges */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-border text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="p-2 bg-muted rounded-full">
                                        <Package className="h-5 w-5 text-foreground" />
                                    </div>
                                    <span className="text-xs font-bold text-muted-foreground uppercase">{t('freeShipping')}</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="p-2 bg-muted rounded-full">
                                        <Check className="h-5 w-5 text-foreground" />
                                    </div>
                                    <span className="text-xs font-bold text-muted-foreground uppercase">{t('secureCheckout')}</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="p-2 bg-muted rounded-full">
                                        <ShoppingBag className="h-5 w-5 text-foreground" />
                                    </div>
                                    <span className="text-xs font-bold text-muted-foreground uppercase">{t('officialGear')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
