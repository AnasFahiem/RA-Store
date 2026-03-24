## 2024-05-24 - [Insecure Randomness in Upload Filenames]
**Vulnerability:** Found `Math.random().toString(36)` being used to generate unique filename identifiers in `lib/actions/upload.ts`.
**Learning:** `Math.random()` is not a Cryptographically Secure Pseudo-Random Number Generator (CSPRNG), making the generated identifiers predictable. This could allow an attacker to guess future filenames, potentially leading to unauthorized access if files are predictably named or causing deliberate file overwrite attacks if UUID collisions occur.
**Prevention:** Always use Node's native `crypto.randomUUID()` or `crypto.randomBytes()` when generating secure identifiers, tokens, or filenames that require unpredictability.
