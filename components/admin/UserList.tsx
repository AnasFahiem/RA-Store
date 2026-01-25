'use client';

import { useState } from 'react';
import { updateUserRole, deleteUser } from '@/lib/actions/users';
import { Shield, ShieldAlert, Trash2, UserCog, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

type UserData = {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
};

export default function UserList({ initialUsers, currentUserRole }: { readonly initialUsers: UserData[], readonly currentUserRole: string }) {
    const [users, setUsers] = useState(initialUsers);
    const [loading, setLoading] = useState<string | null>(null);
    const t = useTranslations('Admin');

    const handleRoleUpdate = async (userId: string, currentRole: string) => {
        if (currentUserRole !== 'owner') return;

        const newRole = currentRole === 'admin' ? 'customer' : 'admin';
        setLoading(userId);

        try {
            await updateUserRole(userId, newRole);
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error('Failed to update role', error);
            alert('Failed to update role');
        } finally {
            setLoading(null);
        }
    };

    const handleDelete = async (userId: string) => {
        if (currentUserRole !== 'owner') return;
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        setLoading(userId);

        try {
            await deleteUser(userId);
            setUsers(users.filter(u => u.id !== userId));
        } catch (error) {
            console.error('Failed to delete user', error);
            alert('Failed to delete user');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="bg-zinc-900 rounded-lg overflow-hidden border border-white/10">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-white/5 text-gray-200 uppercase font-medium">
                        <tr>
                            <th className="px-6 py-4">{t('table.name')}</th>
                            <th className="px-6 py-4">{t('table.email')}</th>
                            <th className="px-6 py-4">{t('table.role')}</th>
                            <th className="px-6 py-4">{t('table.createdAt')}</th>
                            <th className="px-6 py-4 text-right">{t('table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                                    <div className="p-2 bg-white/10 rounded-full">
                                        <User className="w-4 h-4" />
                                    </div>
                                    {user.name || 'N/A'}
                                </td>
                                <td className="px-6 py-4">{user.email}</td>
                                <td className="px-6 py-4">
                                    {(() => {
                                        const roleStyles: Record<string, string> = {
                                            owner: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
                                            admin: 'bg-accent/10 text-accent border border-accent/20',
                                            customer: 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                        };
                                        const style = roleStyles[user.role] || roleStyles.customer;

                                        return (
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
                                                {user.role}
                                            </span>
                                        );
                                    })()}
                                </td>
                                <td className="px-6 py-4">{new Date(user.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right">
                                    {currentUserRole === 'owner' && user.role !== 'owner' && (
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleRoleUpdate(user.id, user.role)}
                                                disabled={loading === user.id}
                                                className={`p-2 rounded-md transition-colors ${user.role === 'admin'
                                                    ? 'text-yellow-500 hover:bg-yellow-500/10'
                                                    : 'text-green-500 hover:bg-green-500/10'
                                                    }`}
                                                title={user.role === 'admin' ? 'Demote to Customer' : 'Promote to Admin'}
                                            >
                                                {user.role === 'admin' ? <ShieldAlert className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                disabled={loading === user.id}
                                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                                                title="Delete User"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
