## 2025-05-24 - [Unauthenticated Server Actions (Broken Access Control)]
**Vulnerability:** Next.js Server actions `addHeaderSlide`, `deleteHeaderSlide`, `addHeroSlide`, `deleteHeroSlide` perform database write operations using `createAdminClient` (which bypasses RLS) without explicit authorization checks.
**Learning:** Next.js Server Actions are public endpoints. They must contain explicit session and role verification (e.g. `session?.role === 'admin'`) before performing privileged operations, especially when using an admin database client.
**Prevention:** Always use `getSession` or `verifySession` to validate roles in every single Server Action that mutates data.
