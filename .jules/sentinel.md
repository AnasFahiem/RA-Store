## 2024-05-18 - Predictable JWT Key Generation

**Vulnerability:** The application was encoding `process.env.JWT_SECRET` directly without checking if it was defined. In Node.js, this means if `JWT_SECRET` is missing in the environment variables, `TextEncoder().encode(undefined)` may evaluate to a zero-length array (Node v22+) or coerce to a predictable 9-byte string 'undefined' (older Node versions), resulting in a predictable symmetric key being used to sign and verify JSON Web Tokens (JWTs). An attacker aware of this could easily forge valid JWTs and escalate privileges.

**Learning:** We must not blindly assume critical environment variables are loaded or populated correctly, particularly those used for cryptographic signing or encryption. Missing configuration should lead to an immediate and loud failure during startup/initialization (fail-closed state) rather than silently falling back to a predictable insecure state.

**Prevention:** Always explicitly validate that security-critical environment variables (such as signing keys or salts) exist and have sufficient length/entropy before they are used in any cryptographic operation. Throw a fatal error (e.g., `throw new Error('JWT_SECRET is missing')`) if they are absent to prevent the application from starting in a vulnerable state.
