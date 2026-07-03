## 2024-05-16 - [Fix JWT Secret Key Forgery]
**Vulnerability:** Node.js silently coerced `undefined` `process.env.JWT_SECRET` into the string `"undefined"`, generating a predictable 9-byte array during signing and verification. This enabled attackers to easily forge valid admin session JWTs.
**Learning:** Implicit environment variable use without strict validation can result in disastrous type-coercion bypasses, particularly in security-critical libraries like `jose`.
**Prevention:** Always explicitly check for the presence of cryptographic secrets and throw clear exceptions if they are missing before using them in encoding or signing operations.
