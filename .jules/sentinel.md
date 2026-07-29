## 2024-07-29 - Predictable JWT Key Generation

**Vulnerability:** The JWT signing logic in `lib/auth/session.ts` passed `process.env.JWT_SECRET` directly to `TextEncoder().encode()` without checking if the environment variable was defined. In Node.js (v22+), passing `undefined` results in a zero-length array, and in older versions, it coerced to a predictable 9-byte string 'undefined', leading to critical key forgery vulnerabilities if the environment variable is missing.

**Learning:** Always validate the presence of sensitive environment variables before using them in cryptographic operations. Failing securely (e.g., throwing an error) is better than silently falling back to a weak or predictable state.

**Prevention:** Implement explicit checks to ensure critical environment variables like `JWT_SECRET` are defined. If they are missing, throw a fatal error immediately during application startup or module initialization.
