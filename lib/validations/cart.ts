import { z } from 'zod';

export const cartItemSchema = z.object({
    productId: z.string().uuid("Invalid product ID"),
    quantity: z.number().int().min(1, "Quantity must be at least 1").max(99, "Quantity cannot exceed 99"),
    variant: z.string().optional().nullable(),
    bundleId: z.string().uuid("Invalid bundle ID").optional().nullable(),
});

export const updateCartItemSchema = z.object({
    productId: z.string().uuid("Invalid product ID"),
    quantity: z.number().int().max(99, "Quantity cannot exceed 99"), // Can be negative/zero to remove
    variant: z.string().optional().nullable(),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
