'use client';

import { useActionState } from 'react';
import { signup } from '@/lib/actions/auth';
import { Link } from '@/lib/navigation';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function SignupPage() {
    const [state, action, isPending] = useActionState(signup, null);
    const t = useTranslations('Auth');

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <Link href="/" className="flex justify-center">
                        <h1 className="text-4xl font-bold font-heading uppercase tracking-tighter text-center">
                            RA STORE
                        </h1>
                    </Link>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 font-heading tracking-wide">
                        {t('signupTitle')}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {t('hasAccount')}{' '}
                        <Link href="/auth/login" className="font-medium text-accent hover:text-black transition-colors">
                            {t('loginButton')}
                        </Link>
                    </p>
                </div>
                <form action={action} className="mt-8 space-y-6">
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="name" className="sr-only">
                                {t('name')}
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-accent focus:border-accent focus:z-10 sm:text-sm"
                                placeholder={t('name')}
                            />
                        </div>
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                {t('email')}
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-accent focus:border-accent focus:z-10 sm:text-sm"
                                placeholder={t('email')}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                {t('password')}
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-accent focus:border-accent focus:z-10 sm:text-sm"
                                placeholder={t('password')}
                            />
                        </div>
                    </div>

                    {state?.error && (
                        <div className="text-red-500 text-sm text-center font-medium">
                            {state.error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                        >
                            {isPending ? <Loader2 className="animate-spin h-5 w-5" /> : t('signupButton')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
