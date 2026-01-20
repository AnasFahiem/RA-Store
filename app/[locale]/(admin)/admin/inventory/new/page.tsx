'use client';

import ProductForm from '@/components/admin/ProductForm';
import { addProduct } from '@/lib/actions/inventory';

export default function AddProductPage() {
    return (
        <ProductForm
            mode="create"
            action={addProduct}
        />
    );
}
