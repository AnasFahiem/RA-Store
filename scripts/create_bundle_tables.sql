-- 1. DISCOUNT RULES
-- Defines logic for dynamic discounts (e.g., "Buy 3 items, get 10% off")
CREATE TABLE IF NOT EXISTS public.discount_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    min_quantity INTEGER NOT NULL DEFAULT 0,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC NOT NULL DEFAULT 0,
    required_category TEXT, -- If NULL, applies to any products
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. BUNDLES
-- Stores both Admin-defined "Pre-made Bundles" and User-saved custom bundles
CREATE TABLE IF NOT EXISTS public.bundles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE, -- Useful for sharing/SEO
    image TEXT,
    type TEXT NOT NULL CHECK (type IN ('admin_fixed', 'user_custom')),
    is_active BOOLEAN DEFAULT true,
    price_override NUMERIC, -- If set, overrides calculated sum (mainly for fixed admin bundles)
    created_by UUID REFERENCES public.users(id), -- Null for system/default admin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. BUNDLE ITEMS
-- Links products to a bundle template
CREATE TABLE IF NOT EXISTS public.bundle_items (
    bundle_id UUID REFERENCES public.bundles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    PRIMARY KEY (bundle_id, product_id)
);

-- 4. UPDATE CART ITEMS
-- Add bundle_id to group items in the cart
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cart_items' AND column_name='bundle_id') THEN 
        ALTER TABLE public.cart_items ADD COLUMN bundle_id UUID REFERENCES public.bundles(id) ON DELETE SET NULL;
    END IF; 
END $$;

-- 5. RLS POLICIES (Basic)
-- Enable RLS
ALTER TABLE public.discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read active discount rules and active admin bundles
CREATE POLICY "Public read active discount rules" ON public.discount_rules FOR SELECT USING (is_active = true);
CREATE POLICY "Public read active bundles" ON public.bundles FOR SELECT USING (is_active = true OR created_by = auth.uid());
CREATE POLICY "Public read bundle items" ON public.bundle_items FOR SELECT USING (true);

-- Admins (Service Role) have full access (implicitly, but explicit policies help if using Supabase client)
-- Assuming we use Service Role for Admin actions, we might not need explicit Admin policies if we bypass RLS.
-- But for User Custom Bundles:
CREATE POLICY "Users can create own bundles" ON public.bundles FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update own bundles" ON public.bundles FOR UPDATE USING (created_by = auth.uid());
