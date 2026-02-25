## 2025-02-18 - [Zod Error Handling]
**Vulnerability:** N/A (Implementation Detail)
**Learning:** `ZodError` in this project (zod ^4.3.5) does not expose the `.errors` property directly on the error object in some contexts, contrary to standard Zod v3 behavior. It uses `.issues`.
**Prevention:** Always inspect error objects or use `.issues` for accessing validation details when working with Zod in this codebase.
