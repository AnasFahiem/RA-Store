## 2025-02-28 - IDOR / Price Manipulation in placeOrder
**Vulnerability:** The `placeOrder` server action trusts client-provided item prices `item.price` and calculates total on the server side instead of fetching the authoritative base price and bundle override price from the database.
**Learning:** Even if data goes through Zod validation, the values are still untrusted input. The database state must be the source of truth for pricing.
**Prevention:** Always lookup pricing in the database by `productId` and `bundleId` when taking an order, discard any client-provided price fields, and calculate the total using the DB values.
