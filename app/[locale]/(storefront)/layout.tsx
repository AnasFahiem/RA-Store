import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { getSession } from "@/lib/auth/session";
import { supabase } from "@/lib/supabase";
import GymBackground from "@/components/shared/GymBackground";
import CartSidebar from "@/components/storefront/CartSidebar";

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
        <div className="min-h-screen flex flex-col relative">
            <GymBackground />
            {/* Navbar needs CartSidebar sibling or logic? Navbar uses context. CartSidebar uses context. They are independent. */}
            <Navbar role={session?.role} userName={userName} />
            <CartSidebar />
            <main className="flex-grow z-10">{children}</main>
            <Footer />
        </div>
    );
}
