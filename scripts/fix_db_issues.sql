
-- ==========================================
-- 1. FIX CART CONSTRAINTS (Allow bundles)
-- ==========================================

-- Drop strict unique constraints
ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_variant_key;
DROP INDEX IF EXISTS cart_items_id_product_id_variant_idx;

-- Allow same product as standalone item (unique per user+variant)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_items_unique_standalone 
ON public.cart_items (user_id, product_id, variant) 
WHERE bundle_id IS NULL;

-- Allow same product inside bundles (unique per bundle instance)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_items_unique_bundle
ON public.cart_items (user_id, product_id, variant, bundle_id)
WHERE bundle_id IS NOT NULL;


-- ==========================================
-- 2. FIX BUNDLE VISIBILITY (Enable RLS)
-- ==========================================

ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view active bundles
DROP POLICY IF EXISTS "Public Read Active Bundles" ON public.bundles;
CREATE POLICY "Public Read Active Bundles" ON public.bundles
  FOR SELECT
  USING (is_active = true);

-- Allow users to view their own bundles (drafts/custom)
DROP POLICY IF EXISTS "Users can view own bundles" ON public.bundles;
CREATE POLICY "Users can view own bundles" ON public.bundles
  FOR SELECT
  USING (auth.uid() = created_by);

-- Allow public access to bundle items
DROP POLICY IF EXISTS "Public Read Bundle Items" ON public.bundle_items;
CREATE POLICY "Public Read Bundle Items" ON public.bundle_items
  FOR SELECT
  USING (true);

-- ==========================================
-- 3. ENSURE ADMIN BUNDLES ARE VISIBLE
-- ==========================================
-- (Optional verification query you can run separately)
-- SELECT * FROM bundles WHERE type = 'admin_fixed';
