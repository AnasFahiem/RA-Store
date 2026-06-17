## 2024-06-17 - Fix JWT Forgery via Undefined Secret Coercion

**Vulnerability:**
The application used `new TextEncoder().encode(process.env.JWT_SECRET)` to create the JWT signing key. If `process.env.JWT_SECRET` was missing, `undefined` was coerced into the string `"undefined"`. This resulted in a valid 9-byte key ("undefined") instead of throwing an error, creating a critical vulnerability where an attacker could forge valid JWTs using the known secret `"undefined"`.

**Learning:**
TypeScript and JavaScript APIs like `TextEncoder.encode()` may implicitly coerce `undefined` to string representations instead of rejecting invalid inputs. Relying on implicit failure for critical cryptographic parameters is unsafe.

**Prevention:**
Always implement explicit runtime validation for critical environment variables (like secrets and keys) at module initialization. If the variable is absent, intentionally throw a fatal error immediately rather than proceeding with a coerced or fallback value.
