-- Add bundle_id to unique constraint to allow same product in different bundles or as standalone
-- Using NULLS NOT DISTINCT to handle NULL bundle_id (standalone) correctly in Postgres 15+

DO $$ 
BEGIN
    -- Drop old constraint if exists
    ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_variant_key;
    
    -- Drop old unique index if exists (auto-created by constraint)
    DROP INDEX IF EXISTS cart_items_user_id_product_id_variant_key;

    -- Drop any other conflicting unique indexes
    DROP INDEX IF EXISTS cart_items_unique_idx;
END $$;

-- Create new unique index including bundle_id
CREATE UNIQUE INDEX cart_items_unique_bundle_idx ON cart_items (user_id, product_id, variant, bundle_id) NULLS NOT DISTINCT;

-- If NULLS NOT DISTINCT is not supported (Postgres < 15), this will fail.
-- If it fails, we will need meaningful fallback or check version.
-- Assuming Supabase is current.
