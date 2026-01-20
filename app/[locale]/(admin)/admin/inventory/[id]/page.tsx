import { supabase } from '@/lib/supabase';
import ProductForm from '@/components/admin/ProductForm';
import { updateProduct } from '@/lib/actions/inventory';
import { notFound } from 'next/navigation';

async function getProduct(id: string) {
    const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !product) return null;
    return product;
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const product = await getProduct(id);

    if (!product) {
        notFound();
    }

    // Bind ID to update action
    const updateAction = updateProduct.bind(null, product.id);

    return (
        <ProductForm
            mode="edit"
            initialData={product}
            action={updateAction}
        />
    );
}
