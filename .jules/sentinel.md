## 2026-04-13 - Server-side price validation to prevent price manipulation and Zod schema field dropping

**Vulnerability:** A critical price manipulation vulnerability existed in the order placement system (`placeOrder` action). The system blindly calculated the order total using prices supplied directly by the client (`item.price`). Additionally, the `bundleId` property on items was being silently stripped during validation because `z.object().strip()` (the Zod default) drops fields not explicitly defined in the schema, rendering server-side bundle pricing impossible to evaluate.

**Learning:** Never trust client-provided pricing data. An attacker could intercept the request and modify item prices to $0. Furthermore, when using schema validation like Zod, failure to explicitly list optional fields like `bundleId` leads to silent data loss, undermining complex pricing logic that relies on those associations.

**Prevention:**
1. Always calculate monetary totals entirely server-side using authoritative price data fetched directly from the database (e.g., `base_price` from products, `price_override` from bundles).
2. Ensure that any client-provided metadata required for server-side logic (such as `bundleId`) is explicitly defined in input validation schemas (e.g., `.optional().nullable()`) to prevent it from being stripped out.
3. Validate quantities of individual products against required bundle configurations server-side before applying bundle pricing overrides, and charge standard base prices for any loose items.
