## 2024-07-16 - Missing Authorization in Hero Server Actions
**Vulnerability:** The server actions in `lib/actions/hero.ts` (`addHeroSlide`, `deleteHeroSlide`, `updateHeroSlideOrder`) use the service role Supabase client (`createAdminClient`) to bypass RLS, but do not perform explicit role-based authorization checks, allowing unauthenticated or low-privilege users to modify the storefront homepage.
**Learning:** Next.js Server Actions are public HTTP endpoints. Using a service role client inside an action without explicit auth checks makes that action an open vulnerability, regardless of where the action is called from in the frontend UI.
**Prevention:** Always invoke `getSession()` and explicitly verify `session?.userId` and `session?.role` (e.g., `admin` or `owner`) within every privileged server action before processing data or interacting with the database.

## 2024-07-16 - Missing Authorization in Header Server Actions
**Vulnerability:** The server actions in `lib/actions/header.ts` (`addHeaderSlide`, `deleteHeaderSlide`, `updateHeaderSettings`) use the service role Supabase client (`createAdminClient`) to bypass RLS, but do not perform explicit role-based authorization checks, allowing unauthenticated or low-privilege users to modify the storefront header configurations.
**Learning:** Similar to the vulnerability found in `hero.ts`, utilizing a service role client inside a public server action without explicit authorization makes the action an open vulnerability, regardless of where it is invoked in the frontend.
**Prevention:** Always invoke `getSession()` and explicitly verify `session?.userId` and `session?.role` (e.g., `admin` or `owner`) within every privileged server action before processing data or interacting with the database.
