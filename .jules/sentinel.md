## 2024-07-15 - Missing JWT_SECRET validation
**Vulnerability:** The application was passing `process.env.JWT_SECRET` directly to `new TextEncoder().encode()` without checking if it was undefined. In Node.js (v22+), `new TextEncoder().encode(undefined)` evaluates to a zero-length array, whereas older versions coerced it to a predictable 9-byte string 'undefined'. This allows an attacker to forge JWT tokens if the environment variable is missing, leading to a critical authentication bypass.
**Learning:** Never assume environment variables are present before passing them to cryptographic functions. Always validate their existence explicitly.
**Prevention:** Always validate environment variable presence before encoding them to prevent critical key forgery vulnerabilities.
