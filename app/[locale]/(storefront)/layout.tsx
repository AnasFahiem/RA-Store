import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

import { getSession } from "@/lib/auth/session";

import { supabase } from "@/lib/supabase";

export default async function StorefrontLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();
    let userName;

    if (session?.userId) {
        const { data: user } = await supabase
            .from('users')
            .select('name')
            .eq('id', session.userId)
            .single();
        userName = user?.name;
    }

    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Navbar role={session?.role} userName={userName} />
            <main className="flex-grow">{children}</main>
            <Footer />
        </div>
    );
}
