## 2024-05-18 - [Predictable Upload Filenames]
**Vulnerability:** Weak random number generation (`Math.random()`) was used to generate filenames in `lib/actions/upload.ts`.
**Learning:** This could lead to predictable file URLs, potentially exposing sensitive files or causing collisions, which is a medium priority issue regarding "Weak random number generation for security purposes".
**Prevention:** Always use cryptographically secure random number generators (e.g., `crypto.randomUUID()`) when generating filenames or secure identifiers.
