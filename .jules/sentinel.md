## $(date +%Y-%m-%d) - [CRITICAL] Admin Endpoints Missing Authentication
**Vulnerability:** Next.js server actions using `createAdminClient()` bypass RLS and lacked role-based authorization checks, allowing any user to mutate data (e.g., in `hero.ts`).
**Learning:** Even if functions are conceptually "admin" actions, Server Actions are exposed as public API endpoints and require explicit authorization logic if they bypass database RLS.
**Prevention:** Always wrap mutating Server Actions that use an admin client or bypass RLS with a robust, centralized role-verification helper like `verifyAdminAction()`.
