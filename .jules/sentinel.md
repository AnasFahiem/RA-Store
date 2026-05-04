## 2025-05-04 - [Broken Access Control in Admin Server Actions]
**Vulnerability:** Next.js Server Actions (e.g., in `hero.ts` and `header.ts`) utilized `createAdminClient` which bypassed Row Level Security (RLS) entirely but did not explicitly verify the role of the user requesting the action.
**Learning:** Returning a server-side action relying on the admin service client without any `verifySession()` or programmatic role checks leaves administrative functions entirely unprotected to unauthenticated or unprivileged users.
**Prevention:** For Next.js Server Actions relying on `createAdminClient`, always enforce an explicit role-based authorization directly in the function, returning an `{ error: string }` object if the user lacks sufficient privileges.
