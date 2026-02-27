// Move `validateSecret` to a separate file to avoid side effects
export function validateSecret(secret: string | undefined): string {
    if (!secret || secret.length < 32) {
        throw new Error('JWT_SECRET is not set or is too short (must be at least 32 characters)');
    }
    return secret;
}
