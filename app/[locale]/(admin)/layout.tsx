import { redirect } from '@/lib/navigation';
import { verifySession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTranslations } from 'next-intl/server';
import AdminSidebar from '@/components/admin/AdminSidebar';

// Check if user is admin against RBAC policy
async function isAdmin(userId: string) {
    const supabase = createAdminClient();
    const { data: user } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

    return user?.role === 'admin' || user?.role === 'owner';
}

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await verifySession();

    if (!session) {
        redirect({ href: '/auth/login', locale: 'en' }); // Fallback or use middleware redirect
    }

    const admin = await isAdmin(session.userId);
    if (!admin) {
        redirect({ href: '/', locale: 'en' });
    }

    const t = await getTranslations('Admin');

    const translations = {
        panel: t('panel'),
        dashboard: t('dashboard.label'),
        orders: t('orders'),
        inventory: t('inventory'),
        bundles: t('bundles'),
        users: t('users'),
        backToShop: t('backToShop'),
        exit: t('exit'),
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <AdminSidebar translations={translations} />

            {/* Main Content - Full width on mobile, offset on desktop */}
            <main className="min-h-screen p-4 pt-16 md:pt-8 md:p-8 md:ltr:ml-64 md:rtl:mr-64">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

