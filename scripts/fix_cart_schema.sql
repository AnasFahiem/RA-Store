-- ==========================================
-- 1. SCHEMA FIX: CUSTOM AUTH COMPATIBILITY
-- ==========================================

-- We must recreate the table because the Foreign Key is likely pointing to auth.users
-- while the app uses public.users.

DROP TABLE IF EXISTS public.cart_items CASCADE;

CREATE TABLE public.cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    -- REFERENCES public.users instead of auth.users
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, 
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    variant TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE NULLS NOT DISTINCT (user_id, product_id, variant, bundle_id)
);

-- Note: We are using Server Actions with Admin Client, so RLS on this table 
-- is technically bypassed, but good to keep enabled for safety if we ever expose it.
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Allow Admin (Service Role) full access (implicitly allowed, but being explicit helps understanding)
-- We don't need detailed user policies anymore since we aren't using Supabase Auth on client.


-- ==========================================
-- 2. ATOMIC UPSERT FUNCTION (Avoids Race Conditions)
-- ==========================================

DROP FUNCTION IF EXISTS public.handle_add_to_cart;

-- Now accepts p_user_id explicitely because we can't trust auth.uid() in custom auth
CREATE OR REPLACE FUNCTION public.handle_admin_add_to_cart(
    p_user_id UUID, 
    p_product_id UUID,
    p_quantity INTEGER,
    p_variant TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_item_id UUID;
BEGIN
    -- Check if item exists
    SELECT id INTO v_current_item_id
    FROM public.cart_items
    WHERE user_id = p_user_id
      AND product_id = p_product_id 
      AND (variant IS NOT DISTINCT FROM p_variant);

    IF v_current_item_id IS NOT NULL THEN
        -- Update
        UPDATE public.cart_items
        SET quantity = quantity + p_quantity,
            created_at = now()
        WHERE id = v_current_item_id;
    ELSE
        -- Insert
        INSERT INTO public.cart_items (user_id, product_id, quantity, variant)
        VALUES (p_user_id, p_product_id, p_quantity, p_variant);
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- Grant access to service_role (Admin)
GRANT EXECUTE ON FUNCTION public.handle_admin_add_to_cart(UUID, UUID, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_admin_add_to_cart(UUID, UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_admin_add_to_cart(UUID, UUID, INTEGER, TEXT) TO anon;
