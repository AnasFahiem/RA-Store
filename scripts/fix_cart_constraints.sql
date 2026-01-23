
-- Drop the existing unique constraint if it exists (name might vary, so we try to drop the index or constraint)
-- Standard constraint name is often cart_items_user_id_product_id_variant_key
ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_variant_key;
DROP INDEX IF EXISTS cart_items_id_product_id_variant_idx; -- Just in case

-- Create partial unique index for standalone items (where bundle_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_items_unique_standalone 
ON public.cart_items (user_id, product_id, variant) 
WHERE bundle_id IS NULL;

-- Create unique index for bundled items (where bundle_id IS NOT NULL)
-- This ensures that within a SINGLE bundle, we don't duplicate the product (we should increase quantity instead).
-- But different bundles (different bundle_id) can contain the same product.
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_items_unique_bundle
ON public.cart_items (user_id, product_id, variant, bundle_id)
WHERE bundle_id IS NOT NULL;
