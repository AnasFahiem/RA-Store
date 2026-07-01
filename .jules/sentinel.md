## 2024-07-01 - Missing Authorization in Header & Hero Server Actions

**Vulnerability:** Found IDOR/Missing Authorization in `lib/actions/hero.ts` (`addHeroSlide`, `deleteHeroSlide`, `updateHeroSlideOrder`) and `lib/actions/header.ts` (`addHeaderSlide`, `deleteHeaderSlide`, `updateHeaderSettings`). These actions used `createAdminClient()` (which bypasses RLS) without verifying the user's role, allowing unauthenticated or non-admin users to manipulate the site's hero slides and header configurations.

**Learning:** When using the service role `createAdminClient()`, RLS policies are bypassed entirely. Therefore, manual RBAC (Role-Based Access Control) checks are absolutely mandatory in Next.js Server Actions. If a server action uses the admin client and modifies database state, it must check the user's session role explicitly before processing inputs.

**Prevention:** Always use the centralized `verifyAdmin()` helper from `lib/auth/session.ts` at the very beginning of any server action that uses `createAdminClient()` for mutating application-wide data (like site content, bundles, rules) or sensitive actions, avoiding duplicate logic and ensuring robust access control.
