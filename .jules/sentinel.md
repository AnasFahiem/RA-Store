## 2024-05-24 - Fix Broken Access Control in Bundle Creation
**Vulnerability:** The `createBundle` server action relied purely on Zod for input validation and allowed any authenticated user to pass `priceOverride` and `type` (e.g., `admin_fixed`). This could lead to parameter tampering and price manipulation vulnerabilities.
**Learning:** Zod schemas only validate the shape of data; explicit authorization checks must be implemented within server actions for sensitive operations. A user could artificially manipulate the price of bundles or create official-looking `admin_fixed` bundles.
**Prevention:** Override sensitive parameters (like `priceOverride` to `undefined` and `type` to `user_custom`) for any user without the required administrative role (`admin` or `owner`).
