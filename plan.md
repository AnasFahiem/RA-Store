1. Add `verifyAdmin` to `lib/auth/session.ts` to check if a user is an admin or owner.
2. In `lib/actions/hero.ts`, add the `verifyAdmin` check to `addHeroSlide`, `deleteHeroSlide`, and `updateHeroSlideOrder`. We will return `{ success: false, error: 'Unauthorized' }` if the user is unauthorized.
3. In `lib/actions/header.ts`, add the `verifyAdmin` check to `addHeaderSlide`, `deleteHeaderSlide`, and `updateHeaderSettings`. We will return `{ success: false, error: 'Unauthorized' }` if the user is unauthorized.
4. Replace existing inline auth checks in `lib/actions/bundleActions.ts` with `verifyAdmin()`.
5. Pre-commit instructions step for testing, formatting, and building.
