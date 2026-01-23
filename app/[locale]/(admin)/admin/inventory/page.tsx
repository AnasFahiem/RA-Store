import { supabase } from '@/lib/supabase';
import { Link } from '@/lib/navigation';
import { Plus, Edit, Package } from 'lucide-react';
import Image from 'next/image';
import { DeleteProductButton } from './delete-button';
import { formatCurrency } from '@/lib/utils/format';
import { getTranslations } from 'next-intl/server';

async function getProducts() {
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }

    // Safely parse JSON fields if they come back as strings
    const safeProducts = products.map(p => {
        let safeImages = [];
        try {
            if (Array.isArray(p.images)) safeImages = p.images;
            else if (typeof p.images === 'string') safeImages = JSON.parse(p.images);
        } catch (e) { safeImages = []; }

        let safeSizes = [];
        try {
            if (Array.isArray(p.sizes)) safeSizes = p.sizes;
            else if (typeof p.sizes === 'string') safeSizes = JSON.parse(p.sizes);
        } catch (e) { safeSizes = []; }

        return { ...p, images: safeImages, sizes: safeSizes };
    });

    return safeProducts;
}

export default async function InventoryPage() {
    const products = await getProducts();
    const t = await getTranslations('Admin');
    const tProd = await getTranslations('Product');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-heading uppercase tracking-wide">{t('inventory')}</h1>
                <Link
                    href="/admin/inventory/new"
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-white font-bold uppercase tracking-wider rounded-md hover:bg-white hover:text-black transition-colors"
                >
                    <Plus className="h-5 w-5" />
                    {t('addProduct')}
                </Link>
            </div>

            <div className="bg-zinc-900 border border-white/5 rounded-lg overflow-hidden">
                <table className="w-full text-start">
                    <thead className="bg-white/5 text-gray-400 uppercase text-xs tracking-wider text-start">
                        <tr>
                            <th className="px-6 py-4 text-start">{t('table.product')}</th>
                            <th className="px-6 py-4 text-start">{t('table.category')}</th>
                            <th className="px-6 py-4 text-start">{t('table.price')}</th>
                            <th className="px-6 py-4 text-start">{t('table.status')}</th>
                            <th className="px-6 py-4 text-end">{t('table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {products.map((product) => (
                            <tr key={product.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 text-start">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 relative bg-white/10 rounded overflow-hidden flex-shrink-0">
                                            {product.images?.[0] ? (
                                                <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                                            ) : (
                                                <Package className="h-6 w-6 text-gray-500 m-auto relative top-3" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{product.name}</p>
                                            <p className="text-xs text-gray-400">{product.sizes?.length ? `${product.sizes.length} sizes` : 'Standard'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-300 text-start">{product.category}</td>
                                <td className="px-6 py-4 text-white font-medium text-start">{formatCurrency(product.base_price)}</td>
                                <td className="px-6 py-4 text-start">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400">
                                        {tProd('inStock')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-end">
                                    <div className="flex items-center justify-end gap-3">
                                        <Link href={`/admin/inventory/${product.id}`} className="text-gray-400 hover:text-white transition-colors">
                                            <Edit className="h-5 w-5" />
                                        </Link>
                                        <DeleteProductButton productId={product.id} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {products.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">{t('noProducts')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
