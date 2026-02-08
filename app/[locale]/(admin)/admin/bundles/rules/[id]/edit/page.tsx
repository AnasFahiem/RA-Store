
import { getDiscountRuleById } from '@/lib/actions/bundleActions';
import EditRuleForm from './form';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{
        id: string;
        locale: string;
    }>;
}

export default async function EditRulePage({ params }: Props) {
    const { id } = await params;
    const rule = await getDiscountRuleById(id);

    if (!rule) {
        notFound();
    }

    return <EditRuleForm rule={rule} />;
}
