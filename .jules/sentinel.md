
## 2024-05-25 - Broken Access Control in Content Actions
**Vulnerability:** Unauthenticated or under-privileged users could invoke Next.js Server Actions in `lib/actions/hero.ts` and `lib/actions/header.ts` (e.g., `addHeroSlide`, `deleteHeroSlide`, `updateHeaderSettings`) because they used `createAdminClient()` (which bypasses RLS) without any role-based authorization checks.
**Learning:** Next.js Server Actions are public endpoints by default. Using service-role clients within them without explicit authorization checks creates broken access control vulnerabilities.
**Prevention:** Always use `verifyAdmin()` or similar session validation checks at the very top of sensitive mutation server actions before executing privileged logic.
