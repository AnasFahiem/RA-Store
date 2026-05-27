## 2024-05-15 - [CRITICAL] Open Redirect via X-Forwarded-Host in Auth Callback
**Vulnerability:** The `app/auth/callback/route.ts` used the user-controllable `x-forwarded-host` header to construct the redirect URL after authentication if the origin wasn't `localhost`.
**Learning:** Even internal-looking headers like `X-Forwarded-Host` can be spoofed by attackers. Using them for redirection allows attackers to create legitimate-looking login links that redirect victims to malicious sites, potentially stealing authorization codes or credentials.
**Prevention:** Always use the verified `origin` derived from the initial request URL (`new URL(request.url)`) for redirection, ensuring users stay on the intended application domain.
