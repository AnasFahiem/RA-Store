## 2026-03-26 - [Insecure Direct Price Override Vulnerability]
**Vulnerability:** Unauthenticated/Unauthorized users could create 'user_custom' bundles and arbitrarily set their own 'priceOverride'. Additionally, anyone could create 'admin_fixed' bundles.
**Learning:** Client-provided price parameters must always be verified. When creating an aggregated entity like a bundle, calculating the price client-side and accepting it as a final source of truth server-side allows attackers to buy items for free or at a highly discounted rate.
**Prevention:** In actions that handle financial data, explicitly perform authorization checks and recalculate totals server-side using trusted data from the database (e.g., product base prices and discount rules).
