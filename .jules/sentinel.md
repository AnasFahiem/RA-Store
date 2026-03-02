## 2024-05-24 - [Missing Authorization Checks]
**Vulnerability:** Server actions in `bundleActions.ts` (`createBundle`) and `hero.ts` (`addHeroSlide`, `deleteHeroSlide`, `updateHeroSlideOrder`) were missing authorization checks.
**Learning:** These actions modify database state using the `createAdminClient` which bypasses Row Level Security (RLS). Without authorization checks, any user (even unauthenticated) could invoke these server actions and modify bundles or hero slides.
**Prevention:** Always verify the user's role and authorization level at the beginning of server actions, especially those that perform mutations using an admin client.
