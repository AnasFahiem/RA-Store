## 2024-06-11 - Broken Access Control in createBundle

**Vulnerability:** The `createBundle` server action in `lib/actions/bundleActions.ts` was missing an authorization check. Any user, regardless of role, could create bundles and manipulate bundle prices via the `priceOverride` parameter.
**Learning:** Next.js Server Actions are public endpoints by default. Even though they may use the `createAdminClient` (which bypasses RLS), they must still explicitly verify the user's role and authorization state internally.
**Prevention:** Always enforce explicit role checks (e.g., `session?.role === 'admin'`) at the very beginning of server actions that perform administrative or privileged operations, especially when using service-role clients.
