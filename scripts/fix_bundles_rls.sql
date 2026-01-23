
-- Enable RLS
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;

-- 1. Allow everyone to view active bundles (including admin_fixed)
DROP POLICY IF EXISTS "Public Read Active Bundles" ON public.bundles;
CREATE POLICY "Public Read Active Bundles" ON public.bundles
  FOR SELECT
  USING (is_active = true);

-- 2. Allow users to view their own bundles (if not covered by above, or for drafts)
DROP POLICY IF EXISTS "Users can view own bundles" ON public.bundles;
CREATE POLICY "Users can view own bundles" ON public.bundles
  FOR SELECT
  USING (auth.uid() = created_by);

-- 3. Allow admins full access (Service Role bypasses RLS, but if using authenticated admin user)
-- Not strictly needed for Service Role, but good practice.

-- FIX for bundle_items too (needed for the join)
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Bundle Items" ON public.bundle_items;
CREATE POLICY "Public Read Bundle Items" ON public.bundle_items
  FOR SELECT
  USING (true); -- Or join with bundles to check active, but true is simpler for public items.
