## 2025-04-28 - [HTML Injection in Email Templates]
**Vulnerability:** User-controllable input (customer name, email, phone, addresses, product names) was directly concatenated into HTML email templates within `lib/email.ts`.
**Learning:** Next.js applications relying on manual string building for HTML emails (e.g., using nodemailer) bypass React's built-in XSS protections. Developer oversight led to unsafe raw string injection.
**Prevention:** Always sanitize untrusted input when manually constructing HTML strings. Created and utilized `escapeHtml` to convert special characters (`&`, `<`, `>`, `"`, `'`) to their corresponding HTML entities before injection.
