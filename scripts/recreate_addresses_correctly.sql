
-- Drop existing table
DROP TABLE IF EXISTS addresses;

-- Recreate addresses table with correct FK to public.users
CREATE TABLE addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    address_line TEXT NOT NULL,
    city TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index
CREATE INDEX idx_addresses_user_id ON addresses(user_id);

-- Enable RLS (though we are bypassing it with admin client for now, it's good practice)
-- However, standard Supabase RLS uses auth.uid(), which won't work with our custom auth unless we sync it.
-- Since we are strictly using Server Actions with `supabaseAdmin` for writes and reads of this table, 
-- we can leave policies empty or allow public read if needed (but better keep it locked and use admin).
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
