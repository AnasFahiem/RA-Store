
## 2024-05-24 - [Insecure Randomness & Missing File Extension Validation in Uploads]
**Vulnerability:** File upload functionality in `lib/actions/upload.ts` used `Math.random()` to generate filenames and lacked strict file extension verification, allowing spoofing of `file.type` to upload malicious files (e.g. .html or .php with an image MIME type).
**Learning:** Client-provided `file.type` or extension cannot be trusted. `Math.random()` is cryptographically weak and can lead to predictable filenames and potential collisions or overwriting vulnerabilities.
**Prevention:** Always validate file extensions against a strict whitelist (e.g. `png`, `jpg`, `jpeg`, `webp`). Always use cryptographically secure methods like `crypto.randomUUID()` for generating secure and unpredictable filenames.
