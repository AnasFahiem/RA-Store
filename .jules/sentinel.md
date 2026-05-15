## 2025-05-15 - [Open Redirect]
**Vulnerability:** Open Redirect vulnerability in Next.js Auth Callback
**Learning:** The `x-forwarded-host` header can be spoofed by an attacker. Relying on it for authentication redirects (e.g., `NextResponse.redirect("https://" + request.headers.get("x-forwarded-host"))`) allows an attacker to control the redirect destination, leading to potential phishing or token leakage.
**Prevention:** Always use the natively derived `origin` (or standard `url` objects) that standard hosting environments enforce instead of blindly trusting spoofable HTTP headers like `x-forwarded-host`.
