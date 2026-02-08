
import { getPromoCodeById } from '@/lib/actions/bundleActions';
import PromoCodeForm from '../../../promo-code-form';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{
        id: string;
        locale: string;
    }>;
}

export default async function EditPromoPage({ params }: Props) {
    const { id } = await params;
    const promo = await getPromoCodeById(id);

    if (!promo) {
        notFound();
    }

    return <PromoCodeForm promo={promo} isEdit={true} />;
}
