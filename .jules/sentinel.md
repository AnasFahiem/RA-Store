## 2024-11-20 - Fix IDOR in hero slide actions

**Vulnerability:** Public API endpoints in `lib/actions/hero.ts` (`addHeroSlide`, `deleteHeroSlide`, `updateHeroSlideOrder`) used the `createAdminClient()` service role without checking if the user was authenticated or had appropriate administrative permissions, leading to an Insecure Direct Object Reference (IDOR) / privilege escalation vulnerability. Anyone could modify the hero slides by directly calling these server actions.
**Learning:** Re-implementing role-checking logic in every server action causes code duplication and increases the chance of omitting critical checks. Next.js server actions are inherently public APIs, even if they aren't exposed in the UI.
**Prevention:** Created a reusable `verifyAdmin()` helper in `lib/auth/session.ts` to enforce authentication and authorization cleanly. This helper should be imported and called at the top of any sensitive server action that modifies data or uses the admin Supabase client.
