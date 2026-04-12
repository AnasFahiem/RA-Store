## 2024-05-24 - [Replaced insecure Math.random with crypto.randomUUID for file names]
**Vulnerability:** The code used `Math.random()` to generate unique file names for file uploads in `lib/actions/upload.ts`.
**Learning:** `Math.random()` is not a cryptographically secure pseudo-random number generator (CSPRNG), making file names potentially predictable, which could lead to file enumeration or overwriting vulnerabilities.
**Prevention:** Use `crypto.randomUUID()` instead of `Math.random()` when generating unique identifiers like file names that need to be unguessable.
