## 2025-02-28 - [Title: Added HTML Sanitization to Emails]
**Vulnerability:** XSS/HTML injection in emails due to unescaped user input.
**Learning:** Order information is frequently sent via email. Since email clients are susceptible to HTML injection (and occasionally XSS if poorly configured), user input must be properly sanitized before being embedded in HTML templates.
**Prevention:** Using `escapeHtml` consistently on user-controlled fields (name, email, address, etc) in email generation logic.
