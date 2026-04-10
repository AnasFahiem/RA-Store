## 2026-04-10 - [JWT Secret and File Upload Vulnerabilities]
**Vulnerability:** Empty JWT_SECRET could crash application; Math.random() used for file upload names and missing strict file extension validation could lead to predictable IDs and arbitrary file uploads.
**Learning:** In Node.js v22, new TextEncoder().encode(undefined) evaluates to an empty Uint8Array, crashing jose HMAC functions. Relying on default extensions extracted from client filenames is unsafe.
**Prevention:** Always explicitly check for process.env.JWT_SECRET prior to cryptographic operations. Use crypto.randomUUID() for unique identifiers and implement strict extension whitelists (jpg, png, etc.) before processing files.
