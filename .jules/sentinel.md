## 2024-05-18 - Missing JWT Secret Validation Key Forgery Risk
**Vulnerability:** Passing an undefined `process.env.JWT_SECRET` to `TextEncoder().encode()` creates an empty Uint8Array on newer Node.js versions (v22+) or the string "undefined" on older versions. This predictable key allows attackers to forge valid JWTs and bypass authentication.
**Learning:** `jose` library functions like `jwtVerify` accept these easily predictable or zero-length keys without throwing validation errors at instantiation time.
**Prevention:** Always explicitly check for the existence of critical environment variables (like secret keys) and throw a hard error on initialization if they are missing, rather than implicitly relying on type coercion or downstream library validation.
