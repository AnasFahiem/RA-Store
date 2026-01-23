import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import { Facebook, Instagram } from 'lucide-react';

export default function Footer() {
    const t = useTranslations('Footer');

    return (
        <footer className="bg-background border-t border-border transition-colors duration-300">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-sm font-bold text-foreground tracking-wider uppercase">{t('badges.factory.title')}</h3>
                        <p className="mt-4 text-base text-muted-foreground">
                            {t('badges.factory.description')}
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground tracking-wider uppercase">{t('support')}</h3>
                        <ul className="mt-4 space-y-4">
                            <li>
                                <Link href="/size-guide" className="text-base text-muted-foreground hover:text-accent font-medium">
                                    {t('sizeGuide')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/shipping" className="text-base text-muted-foreground hover:text-accent font-medium">
                                    {t('shipping')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-base text-muted-foreground hover:text-accent font-medium">
                                    {t('contact')}
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground tracking-wider uppercase">Follow Us</h3>
                        <div className="mt-4 flex space-x-6">
                            <a href="https://www.facebook.com/profile.php?id=61571431865172" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent transition-colors">
                                <span className="sr-only">Facebook</span>
                                <Facebook className="h-6 w-6" />
                            </a>
                            <a href="https://www.instagram.com/ra.sports.supplies?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-accent transition-colors">
                                <span className="sr-only">Instagram</span>
                                <Instagram className="h-6 w-6" />
                            </a>
                        </div>
                    </div>
                </div>
                <div className="mt-8 border-t border-border pt-8 md:flex md:items-center md:justify-between">
                    <p className="text-base text-muted-foreground">
                        &copy; {new Date().getFullYear()} {t('rights')}
                    </p>
                </div>
            </div>
        </footer>
    );
}
