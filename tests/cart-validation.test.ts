import { test, describe } from 'node:test';
import assert from 'node:assert';
import { cartItemSchema, updateCartItemSchema } from '../lib/validations/cart';

describe('Cart Validation Schemas', () => {
    describe('cartItemSchema', () => {
        test('should validate valid cart item', () => {
            const validItem = {
                productId: '123e4567-e89b-12d3-a456-426614174000',
                quantity: 1,
                variant: 'L',
                bundleId: null
            };
            const result = cartItemSchema.safeParse(validItem);
            assert.strictEqual(result.success, true);
        });

        test('should fail with negative quantity', () => {
            const invalidItem = {
                productId: '123e4567-e89b-12d3-a456-426614174000',
                quantity: -1,
            };
            const result = cartItemSchema.safeParse(invalidItem);
            assert.strictEqual(result.success, false);
            if (!result.success) {
                assert.ok(result.error.issues.some(i => i.path.includes('quantity')));
            }
        });

        test('should fail with huge quantity', () => {
            const invalidItem = {
                productId: '123e4567-e89b-12d3-a456-426614174000',
                quantity: 1000,
            };
            const result = cartItemSchema.safeParse(invalidItem);
            assert.strictEqual(result.success, false);
             if (!result.success) {
                assert.ok(result.error.issues.some(i => i.path.includes('quantity')));
            }
        });

        test('should fail with invalid UUID', () => {
            const invalidItem = {
                productId: 'not-a-uuid',
                quantity: 1,
            };
            const result = cartItemSchema.safeParse(invalidItem);
            assert.strictEqual(result.success, false);
             if (!result.success) {
                assert.ok(result.error.issues.some(i => i.path.includes('productId')));
            }
        });
    });

    describe('updateCartItemSchema', () => {
        test('should validate valid update', () => {
            const validUpdate = {
                productId: '123e4567-e89b-12d3-a456-426614174000',
                quantity: 5,
                variant: 'Red'
            };
            const result = updateCartItemSchema.safeParse(validUpdate);
            assert.strictEqual(result.success, true);
        });

        test('should fail with huge quantity', () => {
            const invalidUpdate = {
                productId: '123e4567-e89b-12d3-a456-426614174000',
                quantity: 100,
            };
            const result = updateCartItemSchema.safeParse(invalidUpdate);
            assert.strictEqual(result.success, false);
        });

        test('should allow negative quantity (handled by logic)', () => {
            // Logic handles <= 0 by removing, so schema should probably allow it?
            // Schema has .int() but no .min().
            // Wait, I didn't put .min() in updateCartItemSchema, so negative is allowed by schema.
            // Let's verify that.
            const negativeUpdate = {
                productId: '123e4567-e89b-12d3-a456-426614174000',
                quantity: -1,
            };
            const result = updateCartItemSchema.safeParse(negativeUpdate);
            assert.strictEqual(result.success, true);
        });
    });
});
