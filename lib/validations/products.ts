import { z } from 'zod';

export const productSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    name_ar: z.string().optional(),
    description: z.string().min(10, "Description must be at least 10 characters"),
    description_ar: z.string().optional(),
    base_price: z.coerce.number().min(0, "Price cannot be negative"),
    category: z.string().min(2, "Category is required"),
    images: z.string().optional(), // JSON string or array string
    sizes: z.string().optional(), // JSON string
}).refine(data => {
    // Optional: Validation logic to ensure images/sizes are valid JSON if provided as string
    try {
        if (data.images && typeof data.images === 'string' && !data.images.startsWith('http')) {
            JSON.parse(data.images);
        }
        if (data.sizes && typeof data.sizes === 'string') {
            JSON.parse(data.sizes);
        }
        return true;
    } catch {
        return false;
    }
}, {
    message: "Invalid JSON format for images or sizes"
});

export type ProductInput = z.infer<typeof productSchema>;
