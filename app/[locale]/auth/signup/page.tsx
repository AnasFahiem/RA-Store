'use client';

import { useActionState, useState, useEffect } from 'react';
import { signup } from '@/lib/actions/auth';
import { Link } from '@/lib/navigation';
import { Loader2, ArrowRight, User, Lock, Mail, Eye, EyeOff, Check } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';
import { useTranslations } from 'next-intl';
import BackgroundPattern from '@/components/shared/BackgroundPattern';

export default function SignupPage() {
    const [state, action, isPending] = useActionState(signup, null);
    const t = useTranslations('Auth');
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState('');
    const controls = useAnimation();
    const [hasTyped, setHasTyped] = useState(false);

    // Password requirements
    const requirements = [
        { label: t('requirements.length'), valid: password.length >= 6 },
        { label: t('requirements.uppercase'), valid: /[A-Z]/.test(password) },
        { label: t('requirements.number'), valid: /[0-9]/.test(password) },
        { label: t('requirements.special'), valid: /[^A-Za-z0-9]/.test(password) },
    ];

    const isPasswordValid = requirements.every(r => r.valid);

    // Trigger shake animation when there is an error
    useEffect(() => {
        if (state?.error) {
            controls.start({
                x: [0, -10, 10, -10, 10, 0],
                transition: { duration: 0.5 }
            });
        }
    }, [state?.error, controls]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
            <BackgroundPattern />

            {/* Ambient Light Effects */}
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-md w-full relative z-10">
                <motion.div
                    animate={controls}
                    className="bg-card backdrop-blur-xl border border-border p-8 rounded-2xl shadow-2xl"
                >
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-block mb-6 group">
                            <h1 className="text-4xl font-bold font-heading uppercase tracking-tighter text-foreground group-hover:text-accent transition-colors">
                                RA STORE
                            </h1>
                        </Link>
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                            {t('joinFactory')}
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            {t('startJourney')}
                        </p>
                    </div>

                    <form action={action} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="sr-only">{t('name')}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className={`h-5 w-5 ${state?.error ? 'text-red-400' : 'text-muted-foreground'}`} />
                                    </div>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        autoComplete="name"
                                        required
                                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg leading-5 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 sm:text-sm transition-all ${state?.error
                                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                            : 'border-border focus:ring-accent focus:border-accent'
                                            }`}
                                        placeholder={t('name')}
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="email" className="sr-only">{t('email')}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className={`h-5 w-5 ${state?.error ? 'text-red-400' : 'text-muted-foreground'}`} />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className={`block w-full pl-10 pr-3 py-3 border rounded-lg leading-5 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 sm:text-sm transition-all ${state?.error
                                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                            : 'border-border focus:ring-accent focus:border-accent'
                                            }`}
                                        placeholder={t('email')}
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">{t('password')}</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className={`h-5 w-5 ${state?.error ? 'text-red-400' : 'text-muted-foreground'}`} />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        required
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setHasTyped(true);
                                        }}
                                        className={`block w-full pl-10 pr-10 py-3 border rounded-lg leading-5 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 sm:text-sm transition-all ${(state?.error || (hasTyped && !isPasswordValid))
                                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                            : 'border-border focus:ring-accent focus:border-accent'
                                            }`}
                                        placeholder={t('password')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>

                                {/* Password Requirements */}
                                <div className="mt-3 space-y-1 text-xs">
                                    {requirements.map((req, index) => (
                                        <div key={index} className={`flex items-center gap-2 ${req.valid ? 'text-green-500' : 'text-muted-foreground'}`}>
                                            {req.valid ? (
                                                <Check className="h-3 w-3" />
                                            ) : (
                                                <div className="h-1.5 w-1.5 rounded-full bg-muted" />
                                            )}
                                            <span>{req.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {state?.error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                                <span className="block w-1.5 h-1.5 rounded-full bg-red-500" />
                                {state.error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-black bg-accent hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-wide"
                        >
                            {isPending ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                <>
                                    {t('signupButton')} <ArrowRight className="ml-2 w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            {t('hasAccount')}{' '}
                            <Link href="/auth/login" className="font-bold text-foreground hover:text-accent transition-colors">
                                {t('signIn')}
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
