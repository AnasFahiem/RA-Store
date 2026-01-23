'use client';

import { Trash2 } from 'lucide-react';
import { deleteBundle } from '@/lib/actions/bundleActions';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DeleteBundleButton({ bundleId }: { bundleId: string }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this bundle?')) return;

        setIsDeleting(true);
        const result = await deleteBundle(bundleId);

        if (result.success) {
            router.refresh();
        } else {
            alert(result.error || 'Failed to delete');
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
            title="Delete Bundle"
        >
            <Trash2 className="h-4 w-4" />
        </button>
    );
}
