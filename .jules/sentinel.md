## 2025-05-10 - [CRITICAL] Fixed Broken Access Control & Upload Vulnerabilities in upload.ts
**Vulnerability:**
1. The server action `uploadImage` used `verifySession()` which performs a hard redirect to `/auth/login` on failure. When called as an API endpoint or Server Action from the client, this caused unintended behavior and failed silently rather than returning a structured error.
2. Missing file extension whitelisting allowed potentially malicious files to be uploaded.
3. Cryptographically weak filename generation using `Math.random()` could lead to predictable filenames.
**Learning:**
Server actions that are invoked via fetch/API need to use `getSession()` (which returns `null` if unauthenticated) rather than `verifySession()` (which redirects). File uploads must strictly validate extensions and generate filenames securely using `crypto.randomBytes()`.
**Prevention:**
Always use `getSession()` for API endpoints and Server Actions to return structured errors (e.g., `{ error: 'Unauthorized' }`). Enforce an extension whitelist (`['png', 'jpg', 'jpeg', 'webp']`) and use native `crypto` libraries for unpredictable identifiers.
