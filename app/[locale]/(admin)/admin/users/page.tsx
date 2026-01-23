import { verifySession } from '@/lib/auth/session';
import { redirect } from '@/lib/navigation';
import { getUsers } from '@/lib/actions/users';
import UserList from '@/components/admin/UserList';
import { getTranslations } from 'next-intl/server';

export default async function UsersPage() {
    const session = await verifySession();
    const t = await getTranslations('Admin');

    // Double check authorization, though layout handles it generally
    if (session.role !== 'admin' && session.role !== 'owner') {
        redirect({ href: '/', locale: 'en' });
    }

    const users = await getUsers();

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">{t('usersTitle')}</h1>
            </div>
            <UserList initialUsers={users} currentUserRole={session.role} />
        </div>
    );
}
