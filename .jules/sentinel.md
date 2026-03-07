
## 2024-03-07 - [Missing Authorization in createAdminClient Server Actions]
**Vulnerability:** Found `createBundle`, `getPromoCodes`, and `getPromoCodeById` server actions in `lib/actions/bundleActions.ts` performing database actions using `createAdminClient()` without checking the user session or role.
**Learning:** Functions that utilize a Supabase admin client (`createAdminClient`) bypass Row Level Security (RLS). Any unauthenticated or unauthorized user could execute these endpoints to leak promo codes or create arbitrary bundles.
**Prevention:** Always enforce explicit authorization checks (e.g. `const session = await getSession(); if (session?.role !== 'admin' && session?.role !== 'owner') return { error: 'Unauthorized' };`) at the top of server actions, especially those employing elevated admin privileges.
