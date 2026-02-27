import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateSecret } from '../lib/auth/utils';

describe('Auth Session Security - Unit Tests', () => {

    it('should throw if secret is undefined', () => {
        try {
            validateSecret(undefined);
            assert.fail('Should have thrown error');
        } catch (e: any) {
            assert.match(e.message, /JWT_SECRET is not set/);
        }
    });

    it('should throw if secret is too short', () => {
        try {
            validateSecret('short');
            assert.fail('Should have thrown error');
        } catch (e: any) {
             assert.match(e.message, /JWT_SECRET is not set or is too short/);
        }
    });

    it('should return secret if valid', () => {
        const secret = 'this_is_a_very_long_secret_that_is_at_least_32_chars_long';
        const result = validateSecret(secret);
        assert.strictEqual(result, secret);
    });
});
