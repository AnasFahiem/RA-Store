import { createClient } from '@/lib/supabase/server';
import { createSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/';

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Setup custom session for app compatibility
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Fetch role from public.users
                const { data: profile } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                await createSession(user.id, profile?.role || 'customer');
            }

            const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
            const isLocal = origin.includes('localhost');

            // Validate forwardedHost against our expected site URL to prevent Open Redirect
            const expectedSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
            const expectedHost = expectedSiteUrl ? new URL(expectedSiteUrl).host : '';
            const isValidForwardedHost = forwardedHost && expectedHost && forwardedHost === expectedHost;

            if (isLocal) {
                // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
                return NextResponse.redirect(`${origin}/auth/login?verified=true`);
            } else if (isValidForwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}/auth/login?verified=true`);
            } else {
                return NextResponse.redirect(`${origin}/auth/login?verified=true`);
            }
        }
        console.error('Auth Callback Error:', error);
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/login?error=auth_code_error`);
}
