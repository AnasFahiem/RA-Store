## 2024-05-18 - Missing Authorization Checks on Server Actions
**Vulnerability:** Found IDOR/Authorization bypass vulnerabilities in server actions `createBundle`, `getPromoCodes`, `getPromoCodeById`, and `getDiscountRuleById` where sensitive administrative data was accessible because `createAdminClient()` bypassed Row Level Security (RLS) but no explicit role check (`verifyAdmin()`) was enforced.
**Learning:** Next.js Server Actions are public API endpoints and must enforce explicit role-based authorization directly when using service-role Supabase clients, as they bypass RLS.
**Prevention:** Always verify a user's role explicitly using `verifyAdmin()` or similar checks in server actions before processing data or fetching sensitive information with a service-role client.
