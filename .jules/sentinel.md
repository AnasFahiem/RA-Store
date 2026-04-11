## 2026-04-11 - [HIGH] Insecure Filename Generation and Missing Extension Validation
**Vulnerability:** Predictable filename generation using `Math.random()` and missing server-side extension validation in file upload action.
**Learning:** Depending solely on Supabase bucket restrictions is insufficient, especially when buckets are self-healing. `Math.random()` is not cryptographically secure and can lead to predictable filenames, potentially allowing attackers to guess or overwrite files.
**Prevention:** Always use `crypto.randomUUID()` for generating secure random filenames and explicitly validate file extensions against a whitelist server-side before processing the upload.
