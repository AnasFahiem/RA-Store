import { z } from 'zod';

export const addToCartSchema = z.object({
  productId: z.string().uuid({ message: "Invalid product ID" }),
  quantity: z.number().int().min(1, { message: "Quantity must be at least 1" }),
  variant: z.string().optional(),
  bundleId: z.string().uuid({ message: "Invalid bundle ID" }).optional(),
});

export const updateQuantitySchema = z.object({
  productId: z.string().uuid({ message: "Invalid product ID" }),
  quantity: z.number().int({ message: "Quantity must be an integer" }),
  variant: z.string().optional(),
});

export const removeFromCartSchema = z.object({
  productId: z.string().uuid({ message: "Invalid product ID" }),
  variant: z.string().optional(),
});

export const removeBundleSchema = z.object({
  bundleId: z.string().uuid({ message: "Invalid bundle ID" }),
});
