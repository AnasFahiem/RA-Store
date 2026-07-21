## 2024-05-24 - [CRITICAL] Fix JWT Secret initialization to prevent key forgery

**Vulnerability:** The application was passing `process.env.JWT_SECRET` directly to `TextEncoder().encode()` without checking if the environment variable was actually defined. If the variable is missing, `TextEncoder().encode(undefined)` generates a zero-length array (in Node.js v22+) or the string "undefined", resulting in a predictable and easily forgeable signing key for all user sessions.

**Learning:** When passing values from `process.env` to cryptographic functions, missing variables do not necessarily throw errors natively. They can silently degrade into empty strings, zero-length arrays, or literal strings like "undefined", which effectively bypasses the cryptographic protection altogether. Node 22 treats `undefined` differently from older Node versions in `TextEncoder()`, turning it into an empty Uint8Array instead of the string 'undefined', but both scenarios are critically insecure.

**Prevention:** Always implement fail-closed initialization logic by explicitly verifying the presence and valid length of critical environment variables (like `JWT_SECRET`) before using them. Throw a clear, hard error on startup if they are missing to prevent the application from running in an insecure state.
