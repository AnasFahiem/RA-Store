import createMiddleware from 'next-intl/middleware';
import { routing } from './lib/navigation';
import { updateSession } from './lib/supabase/middleware';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
    // 1. Run Supabase Middleware to refresh session (updates cookies on request/response)
    const response = await updateSession(request);

    // 2. Run Intl Middleware
    const intlResponse = intlMiddleware(request);

    // 3. Merge Headers/Cookies
    // We need to ensure that if Supabase set any cookies, they are preserved.
    if (response.headers.has('set-cookie')) {
        const cookies = response.headers.getSetCookie();
        cookies.forEach(cookie => {
            intlResponse.headers.append('set-cookie', cookie);
        });
    }

    return intlResponse;
}

export const config = {
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
