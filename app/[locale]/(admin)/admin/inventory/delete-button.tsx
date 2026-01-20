'use client';

import { deleteProduct } from '@/lib/actions/inventory';
import { Trash2 } from 'lucide-react';
import { useTransition } from 'react';
import { useRouter } from '@/lib/navigation';
import { useTranslations } from 'next-intl';

export function DeleteProductButton({ productId }: { productId: string }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const t = useTranslations('Common');

    const handleDelete = async () => {
        if (confirm(t('deleteConfirm'))) {
            startTransition(async () => {
                await deleteProduct(productId);
                router.refresh();
            });
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
            title="Delete Product"
        >
            <Trash2 className="h-5 w-5" />
        </button>
    );
}
