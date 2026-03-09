
## 2025-03-09 - [Fail Securely: Enforce JWT Secret Configuration]
**Vulnerability:** Missing `process.env.JWT_SECRET` caused `TextEncoder().encode(undefined)` to evaluate to a zero-length array. The `jose` library subsequently crashed deeply with an unhandled exception or worse, risked falling back to predictable empty-key signing depending on the exact version/configuration.
**Learning:** If essential security configurations (like signing secrets) are omitted from the environment, the application must immediately throw a fatal error during initialization to prevent unsafe states, unauthenticated access, or ambiguous crashes.
**Prevention:** Always assert the presence of critical environment variables (e.g., `if (!process.env.JWT_SECRET) throw new Error(...)`) at the module level before passing them to cryptographic functions.
