## 2026-06-24 - Broken Access Control in createBundle
**Vulnerability:** The `createBundle` server action in `lib/actions/bundleActions.ts` lacked role-based authorization checks before using `createAdminClient()`, allowing any user (or unauthenticated users) to create bundles.
**Learning:** When using Next.js Server Actions with a service-role Supabase client (`createAdminClient`) that bypasses RLS, explicit session and role verification (`session?.role === 'admin' || session?.role === 'owner'`) must be enforced at the beginning of the function.
**Prevention:** Always verify both `session?.userId` and `session?.role` at the top of privileged server actions before processing data or interacting with the database using admin clients.
