'use client';

import { Trash2 } from 'lucide-react';
import { deleteDiscountRule } from '@/lib/actions/bundleActions';
import { useRouter } from '@/lib/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function DeleteRuleButton({ ruleId }: { ruleId: string }) {
    const router = useRouter();
    const t = useTranslations('Admin');
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm(t('confirmDeleteRule'))) return;

        setIsDeleting(true);
        const result = await deleteDiscountRule(ruleId);

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
            title={t('deleteRule')}
        >
            <Trash2 className="h-4 w-4" />
        </button>
    );
}
