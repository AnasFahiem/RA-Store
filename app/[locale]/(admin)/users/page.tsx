import { getUsers } from '@/lib/actions/users';
import { verifySession } from '@/lib/auth/session';
import UserList from '@/components/admin/UserList';
import { redirect } from '@/lib/navigation';

export default async function UsersPage() {
    const session = await verifySession();

    // Double check authorization, though layout handles it generally
    if (session.role !== 'admin' && session.role !== 'owner') {
        redirect({ href: '/', locale: 'en' });
    }

    const users = await getUsers();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-heading uppercase tracking-wide text-white">Users</h1>
                    <p className="text-gray-400 mt-1">Manage platform users and permissions.</p>
                </div>
            </div>

            <UserList initialUsers={users} currentUserRole={session.role} />
        </div>
    );
}
