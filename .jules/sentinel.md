## 2024-05-18 - Insecure Random Number Generation for Filenames
**Vulnerability:** Found `Math.random()` being used to generate unique identifiers for uploaded file names in `lib/actions/upload.ts`. `Math.random()` is not a cryptographically secure pseudo-random number generator (CSPRNG).
**Learning:** Using predictable random numbers for file generation can lead to filename collisions and potentially expose sensitive information or allow file overwrites if an attacker can predict the sequence.
**Prevention:** Always use `crypto.randomUUID()` or a CSPRNG from the `crypto` module when generating unique identifiers, tokens, or filenames that require unpredictability.
