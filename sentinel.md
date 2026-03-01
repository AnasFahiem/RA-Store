## 2024-03-01 - Missing Authorization on Admin Endpoints
**Vulnerability:** Missing server-side verification in `orderActions.ts` (client-side price calculation trust).
**Learning:** `placeOrder` server action in `lib/actions/orderActions.ts` iterates over `items` submitted by the client and blindly trusts the `price` field provided by the user to calculate the total amount and save it in the database. A malicious user could send `price: 0.01` and purchase any item. This pattern occurs when using Supabase admin client combined with server actions that don't re-verify prices against the database.
**Prevention:** Always re-fetch product prices from the database on the server side when processing an order, instead of trusting the price provided by the client.
