## 2024-05-26 - Predictable Filename Vulnerability
**Vulnerability:** Found insecure use of `Math.random()` to generate file names during image upload in `lib/actions/upload.ts`.
**Learning:** Using `Math.random()` for filename generation makes names predictable, which could allow attackers to guess URLs of uploaded files, leading to unauthorized access or potential file overwrite attacks.
**Prevention:** Always use a cryptographically secure pseudo-random number generator (CSPRNG), such as Node.js's native `crypto.randomUUID()`, when generating unique identifiers for security-sensitive operations like file names or tokens.
