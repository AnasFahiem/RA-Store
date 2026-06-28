## 2025-06-28 - Fix Broken Access Control in Bundle and Promo Actions
**Vulnerability:** IDOR and broken access control in `createBundle` and `getPromoCodes` actions, allowing unauthenticated or non-admin users to create bundles and view promo codes.
**Learning:** When creating public-facing server actions using `createAdminClient()`, authorization checks must be explicitly enforced, as service roles bypass RLS.
**Prevention:** Use the `verifyAdmin()` helper at the top of all admin-only server actions to consistently enforce authorization.
