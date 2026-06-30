## 2024-06-30 - JWT Secret Coercion Vulnerability

**Vulnerability:** In Next.js environments using Node.js, `new TextEncoder().encode(undefined)` does not throw an error or result in an empty byte array. Instead, it coerces the `undefined` to the string `"undefined"` and returns a 9-byte array `[117, 110, 100, 101, 102, 105, 110, 101, 100]`. This allows an attacker to forge JWT tokens by signing them with the word `"undefined"` if the `JWT_SECRET` environment variable is missing on the server.

**Learning:** When passing `process.env.*` variables to encoding functions like `TextEncoder().encode()`, Node.js will silently coerce the `undefined` value into a string. The application did not explicitly validate the presence of the required environment variable, leaving the possibility of silent fallback to an easily guessable string as a signing key.

**Prevention:** Always explicitly validate that critical environment variables (especially secrets and keys) are defined before passing them to any encoding or cryptographic functions. Throw an explicit error during initialization if they are missing.
