-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow public read access (SELECT) to products
CREATE POLICY "Public can view products"
ON products FOR SELECT
USING (true);

-- Ensure the policy is applied (in case it existed with different permissions, drop first might be safer but IF NOT EXISTS is good for new)
-- To be safe, let's drop potential conflicting policies first?
-- DROP POLICY IF EXISTS "Public can view products" ON products;
-- CREATE POLICY "Public can view products" ON products FOR SELECT USING (true);
