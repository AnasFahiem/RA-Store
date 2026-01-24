import { useTranslations } from 'next-intl';

export default function AboutPage() {
    const t = useTranslations('About');

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-4xl font-bold font-heading uppercase tracking-wide mb-8">{t('title')}</h1>
            <div className="prose prose-lg text-gray-500">
                <p>
                    {t('p1')}
                </p>
                <p>
                    {t('p2')}
                </p>
                <p>
                    {t('p3')}
                </p>
            </div>
        </div>
    );
}
