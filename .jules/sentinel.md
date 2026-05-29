## 2024-05-24 - Missing Authorization in Admin Server Actions
**Vulnerability:** Broken Access Control (BAC)
**Learning:** Next.js Server Actions utilizing the `createAdminClient()` (Supabase Service Role) bypass Row Level Security (RLS). When these actions are missing explicit user role checks, unauthenticated or unauthorized users can trigger admin-level database modifications (e.g., modifying UI hero/header content).
**Prevention:** Always ensure explicit inline authorization checks (e.g., verifying session and role against 'admin' or 'owner') at the beginning of any Server Action that mutates data using `createAdminClient()`.
