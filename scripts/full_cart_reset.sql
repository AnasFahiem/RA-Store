-- ==========================================
-- 1. RESET ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS (Idempotent)
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to ensure a clean slate (handling all possible names)
DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "owner_view" ON public.cart_items;
DROP POLICY IF EXISTS "owner_insert" ON public.cart_items;
DROP POLICY IF EXISTS "owner_update" ON public.cart_items;
DROP POLICY IF EXISTS "owner_delete" ON public.cart_items;

-- Create STRICT Policies

-- 1. SELECT: Users can only see their own items
CREATE POLICY "owner_view" ON public.cart_items 
    FOR SELECT USING (auth.uid() = user_id);

-- 2. INSERT: Users can only insert items where user_id matches their auth ID
-- CRITICAL: We use WITH CHECK for INSERT to validate the new row.
CREATE POLICY "owner_insert" ON public.cart_items 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE: Users can only update their own items
CREATE POLICY "owner_update" ON public.cart_items 
    FOR UPDATE USING (auth.uid() = user_id);

-- 4. DELETE: Users can only delete their own items
CREATE POLICY "owner_delete" ON public.cart_items 
    FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- 2. UNIQUE CONSTRAINT & INDEXES
-- ==========================================

-- Drop constraint if it exists
ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_variant_key;
ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS unique_cart_item;

-- Add strict unique constraint for Upsert logic configuration
ALTER TABLE public.cart_items 
    ADD CONSTRAINT cart_items_user_id_product_id_variant_key 
    UNIQUE (user_id, product_id, variant);

-- ==========================================
-- 3. ATOMIC UPSERT FUNCTION (RPC)
-- ==========================================
-- This function handles complications of "Insert vs Update" internally on the server

CREATE OR REPLACE FUNCTION public.handle_add_to_cart(
    p_product_id UUID,
    p_quantity INTEGER,
    p_variant TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with admin privileges to bypass RLS complexity during the complex upsert check
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_current_item_id UUID;
BEGIN
    -- 1. Get User ID securely
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Check overlap
    SELECT id INTO v_current_item_id
    FROM public.cart_items
    WHERE user_id = v_user_id 
      AND product_id = p_product_id 
      AND (variant IS NOT DISTINCT FROM p_variant);

    -- 3. Execute Logic
    IF v_current_item_id IS NOT NULL THEN
        -- Update existing quantity
        UPDATE public.cart_items
        SET quantity = quantity + p_quantity,
            created_at = now()
        WHERE id = v_current_item_id;
    ELSE
        -- Insert new row
        INSERT INTO public.cart_items (user_id, product_id, quantity, variant)
        VALUES (v_user_id, p_product_id, p_quantity, p_variant);
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- Grant Execution Permissions
GRANT EXECUTE ON FUNCTION public.handle_add_to_cart(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_add_to_cart(UUID, INTEGER, TEXT) TO service_role;
