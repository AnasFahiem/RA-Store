## 2026-07-23 - Missing Authorization Checks in Admin API Endpoints

**Vulnerability:** The hero and header management server actions (`lib/actions/hero.ts` and `lib/actions/header.ts`) lacked role-based authorization checks, allowing any user (even unauthenticated) to add, modify, or delete hero and header slides.

**Learning:** Server actions exposed as public API endpoints bypass RLS when using the service-role Supabase client (`createAdminClient`). Any action that modifies application state must explicitly verify the user's authentication and authorization level (e.g., 'admin' or 'owner') before processing the request.

**Prevention:** Implement and enforce a centralized `verifyAdmin` helper function to perform role-based authorization checks across all sensitive server actions prior to processing data.
