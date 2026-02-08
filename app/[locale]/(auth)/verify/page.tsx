import Link from 'next/link';

export default function VerifyMetadata() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 text-center space-y-6 shadow-lg">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-black">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-foreground">Check your email</h1>

                <p className="text-muted-foreground">
                    We've sent a verification link to your email address. Please click the link to confirm your account and log in.
                </p>

                <div className="pt-4">
                    <Link
                        href="/auth/login"
                        className="text-sm text-accent hover:underline decoration-accent underline-offset-4 font-bold"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
