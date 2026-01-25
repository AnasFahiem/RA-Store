import { createClient } from '@/lib/supabase/server';
import ProductForm from '@/components/admin/ProductForm';
import { updateProduct } from '@/lib/actions/inventory';
import { notFound } from 'next/navigation';

async function getProduct(id: string) {
    const supabase = await createClient();
    const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

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

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return getProduct(id);
}
