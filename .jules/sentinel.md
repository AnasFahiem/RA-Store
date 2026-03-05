## 2024-05-18 - Missing Authorization in Server Actions with Admin Client
**Vulnerability:** The `createBundle` server action in `lib/actions/bundleActions.ts` lacked an explicit authorization check (`if (session?.role !== 'admin' && session?.role !== 'owner')`), allowing any authenticated or unauthenticated user to create bundles.
**Learning:** Server actions utilizing `createAdminClient()` bypass Supabase's Row Level Security (RLS) entirely. When using the admin client, role-based authorization must be explicitly enforced in the application code before performing any database operations.
**Prevention:** Always verify the user's session and role (`admin` or `owner`) at the very beginning of any server action that uses `createAdminClient()` or performs sensitive operations.
