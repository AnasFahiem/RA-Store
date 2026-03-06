## 2025-02-17 - [CRITICAL] Fix Client-Side Price Calculation Manipulation
**Vulnerability:** The server `placeOrder` action trusted client-provided item prices from the payload to calculate the total order amount and persist order items.
**Learning:** Trusting client-provided prices in checkout payloads leads to severe financial risk, as attackers can place orders at arbitrary prices (e.g., $0).
**Prevention:** Always fetch authoritative prices (`base_price`) from the database (`products` table) using a server-side query during order finalization, rather than relying on the client's payload.
