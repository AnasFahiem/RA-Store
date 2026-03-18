## 2024-06-25 - [Client-Side Price Calculation]
**Vulnerability:** The server accepts price provided by the client when creating an order and calculates the total from it without server-side validation against the product database.
**Learning:** Client inputs can be manipulated to purchase items at a lower price or for free.
**Prevention:** Always calculate and verify prices on the server side using the database as the source of truth.
