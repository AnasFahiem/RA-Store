## 2024-05-24 - [CRITICAL] Fix Price Manipulation Vulnerability in Bundle Creation
**Vulnerability:** A standard user could set an arbitrary `priceOverride` for a `user_custom` bundle or forge an `admin_fixed` bundle request in `lib/actions/bundleActions.ts`.
**Learning:** `createBundle` uses `createAdminClient` which bypasses Row Level Security. Without server-side role validation in the Next.js action, any data conforming to the schema (including price overrides and restricted types) is inserted directly.
**Prevention:** Always validate user roles inside Next.js Server Actions when they use a service role/admin client, explicitly stripping restricted fields (`priceOverride`) or rejecting unauthorized types (`admin_fixed`) before inserting.
