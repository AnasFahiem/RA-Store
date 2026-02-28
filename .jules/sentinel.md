## YYYY-MM-DD - [Secure Random String Generation]
**Vulnerability:** Predictable filename generation in file uploads using `Math.random()`.
**Learning:** `Math.random()` is not cryptographically secure and should not be used to generate secure IDs, tokens, or unpredictable filenames. Predictable filenames allow attackers to guess URLs and potentially gain unauthorized access or overwrite files.
**Prevention:** Use the built-in Node.js `crypto` module (e.g., `crypto.randomUUID()` or `crypto.randomBytes()`) for generating secure random strings or identifiers.