'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/lib/navigation';
import { Globe } from 'lucide-react';

export default function AdminLanguageToggle() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const toggleLocale = () => {
        const nextLocale = locale === 'en' ? 'ar' : 'en';
        router.replace(pathname, { locale: nextLocale });
    };

    return (
        <button
            onClick={toggleLocale}
            className="flex items-center gap-3 px-4 py-3 rounded-md text-gray-400 hover:bg-black/50 hover:text-white transition-colors w-full text-left"
        >
            <Globe className="h-5 w-5" />
            <span>{locale === 'en' ? 'Switch to Arabic' : 'Switch to English'}</span>
        </button>
    );
}
