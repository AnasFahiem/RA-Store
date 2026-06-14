## 2024-06-14 - Broken Access Control in Admin Server Actions

**Vulnerability:** Next.js Server Actions intended for administrators (e.g., modifying hero slides and header settings) were missing explicit role-based authorization checks while utilizing a service-role Supabase client (`createAdminClient()`). Because the service-role client bypasses Row Level Security (RLS) entirely, any unauthenticated or unauthorized user could invoke these public API endpoints to modify critical store configurations.

**Learning:** When using Next.js Server Actions, they function as public POST endpoints. Relying solely on client-side routing protection or UI hiding is insufficient. Furthermore, because `createAdminClient()` explicitly bypasses database RLS policies, the burden of authorization falls entirely on the server action itself. Missing `getSession()` checks in such functions lead directly to Broken Access Control.

**Prevention:** Always implement explicit role-based authorization checks (e.g., via `getSession()` and checking for 'admin' or 'owner' roles) at the very beginning of every server action that performs mutating operations or uses an administrative database client. Return an `{ error: string }` object or throw an error immediately if the checks fail.
