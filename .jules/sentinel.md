## 2025-05-08 - [HTML Injection in Email Templates]
**Vulnerability:** User-controllable input (such as customer name, address, and product name/variant) was not sanitized before rendering in HTML emails, leading to potential HTML/XSS injection.
**Learning:** External variables passed into string template literals used as HTML bodies (`html: emailTemplate(...)`) are evaluated directly, posing a security risk.
**Prevention:** Always sanitize/escape user-controllable strings using `escapeHtml` before rendering them in HTML templates. Handle non-strings by explicitly casting them to strings, and nullish inputs to empty strings securely.
