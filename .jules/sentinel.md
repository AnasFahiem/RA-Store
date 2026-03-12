## 2024-05-24 - Client-side price calculation vulnerability

**Vulnerability:** The `placeOrder` server action in `lib/actions/orderActions.ts` trusts the `price` field provided by the client in the `items` array to calculate the order total (`total_amount`). It does not verify the item prices against the database, which is a critical security vulnerability. An attacker can submit an order with arbitrarily low prices (e.g., $0.01) and checkout successfully.

**Learning:** Server actions must *never* trust pricing or sensitive data provided by the client. The client can tamper with the data before submitting. The server must be the source of truth for pricing.

**Prevention:** Always calculate the total order amount on the server using prices fetched securely from the database based on the item IDs (and handling bundles/overrides correctly). Do not accept `price` as an input for the final calculation from the client.
