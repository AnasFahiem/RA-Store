## 2025-05-15 - Open Redirect via X-Forwarded-Host
**Vulnerability:** The application was using the `X-Forwarded-Host` header to determine the redirect origin in the authentication callback (`app/auth/callback/route.ts`).
**Learning:** `X-Forwarded-Host` can be easily spoofed by an attacker, allowing them to redirect users to a malicious site after successful authentication.
**Prevention:** Always use the verified `origin` derived directly from `new URL(request.url)` to construct redirect URLs, as it reflects the host the user actually visited.
