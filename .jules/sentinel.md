## 2025-02-24 - HTML Injection in Email Templates
**Vulnerability:** User-provided inputs (e.g., customer names, addresses, item names, variants) were interpolated directly into HTML email templates without sanitization, leading to a Cross-Site Scripting (XSS) / HTML Injection vulnerability if an attacker provided malicious input in their order details.
**Learning:** Even internal or transactional emails that render HTML need to sanitize data sourced from user inputs or database fields, as email clients can still execute or render malicious payloads (e.g., `<img src="x" onerror="alert(1)">` or misleading links/styles).
**Prevention:** Always use a utility like `escapeHtml` to encode special characters (`&`, `<`, `>`, `"`, `'`) before interpolating dynamic data into HTML structures.
