import { supabase } from '@/lib/supabase';
import { verifySession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod'; // Ensure zod is installed or use manual validation

async function getUserProfile(userId: string) {
    const { data: user, error } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', userId)
        .single();

    if (error) return null;
    return user;
}

export default async function ProfilePage() {
    const session = await verifySession();
    if (!session) redirect('/auth/login');
    const t = await getTranslations('Account');

    const user = await getUserProfile(session.userId);
    if (!user) return <div>Error loading profile</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold font-heading uppercase mb-6">{t('profile')}</h1>

            <div className="bg-black/40 border border-white/10 rounded-lg p-6 max-w-2xl">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">{t('fullName')}</label>
                        <div className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded text-gray-300 cursor-not-allowed opacity-75">
                            {user.name}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">{t('emailAddress')}</label>
                        <div className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded text-gray-300 cursor-not-allowed opacity-75">
                            {user.email}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/5">
                        <p className="text-sm text-gray-500">
                            {t('emailChange')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
