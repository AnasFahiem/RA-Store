import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const key = new TextEncoder().encode(process.env.JWT_SECRET);

const cookie = {
    name: 'session',
    options: { httpOnly: true, secure: true, sameSite: 'lax', path: '/' },
    duration: 24 * 60 * 60 * 1000,
};

export async function encrypt(payload: any) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1day')
        .sign(key);
}

export async function decrypt(session: string | undefined = '') {
    try {
        const { payload } = await jwtVerify(session, key, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch (error) {
        // Session invalid or expired
        return null;
    }
}

export async function createSession(userId: string, role: string) {
    const expires = new Date(Date.now() + cookie.duration);
    const session = await encrypt({ userId, role, expires });

    (await cookies()).set(cookie.name, session, { ...cookie.options, expires } as any);
}

export async function verifySession() {
    const cookieValue = (await cookies()).get(cookie.name)?.value;
    const session = await decrypt(cookieValue);

    if (!session?.userId) {
        redirect('/auth/login');
    }

    return { userId: session.userId as string, role: session.role as string };
}

export async function deleteSession() {
    (await cookies()).delete(cookie.name);
    redirect('/auth/login');
}

export async function getSession() {
    const cookieValue = (await cookies()).get(cookie.name)?.value;
    const session = await decrypt(cookieValue);

    if (!session?.userId) {
        return null;
    }

    return { userId: session.userId as string, role: session.role as string };
}
