## 2025-02-19 - [Host Header Injection / Open Redirect]
**Vulnerability:** Found an Open Redirect vulnerability in `app/auth/callback/route.ts` because it used the `x-forwarded-host` header unconditionally to determine the redirect URL upon successful authentication.
**Learning:** Next.js Server actions and API routes should not trust user-controlled headers (like `x-forwarded-host`) without explicit validation or an allowlist, as this allows attackers to send users to malicious domains after logging in.
**Prevention:** Instead of reading the header directly, use `new URL(request.url).origin` or configured framework-level proxy settings.
