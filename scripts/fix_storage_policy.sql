-- Allow uploads to the 'products' bucket for everyone (since we gate it via Server Action)
-- This fixes the "new row violates row-level security policy" error.

DO $$
BEGIN
    -- Check if policy exists to avoid error
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow public insert products'
    ) THEN
        CREATE POLICY "Allow public insert products" 
        ON storage.objects 
        FOR INSERT 
        WITH CHECK (bucket_id = 'products');
    END IF;

     -- Also ensure SELECT is allowed so we can see them (though public: true on bucket should handle this)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow public select products'
    ) THEN
        CREATE POLICY "Allow public select products" 
        ON storage.objects 
        FOR SELECT
        USING (bucket_id = 'products');
    END IF;
END
$$;
