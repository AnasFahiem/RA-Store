## 2023-10-27 - [Fix Open Redirect in Auth Callback]
**Vulnerability:** The authentication callback endpoint (`app/auth/callback/route.ts`) trusted the `X-Forwarded-Host` request header to construct the redirect URL after successful login. This allowed an attacker to manipulate the header and redirect users to an arbitrary external malicious site (Open Redirect).
**Learning:** Never trust client-controlled headers like `X-Forwarded-Host` or `Host` when constructing URLs for redirection unless strictly validated against an allowlist.
**Prevention:** Rely entirely on the verified host origin extracted from the incoming request (`new URL(request.url).origin`) or use relative paths for internal application routing.
