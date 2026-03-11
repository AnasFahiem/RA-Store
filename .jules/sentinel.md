## 2024-05-15 - [Critical Server-Side Price Verification]
**Vulnerability:** Client-side price calculation in `orderActions.ts` (`placeOrder`) relies completely on the price submitted by the client `total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)`.
**Learning:** Client-provided prices must never be trusted. They can easily be tampered with by intercepting the request or modifying local state.
**Prevention:** Server-side price verification must be implemented by querying the authoritative price from the database (e.g., `products.base_price` and `bundles.price_override`) and recalculating the total on the server before applying promo codes or processing the payment/order insertion.
