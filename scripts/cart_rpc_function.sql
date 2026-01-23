-- Create a specific function to handle "Add to Cart" logic atomically
-- This avoids race conditions and simplifies client logic (no need to calculate total quantity on client)

CREATE OR REPLACE FUNCTION public.add_item_to_cart(
    p_product_id UUID,
    p_quantity INTEGER,
    p_variant TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with permissions of the function creator (usually admin/postgres)
SET search_path = public -- Secure search path
AS $$
DECLARE
    v_user_id UUID;
    v_new_quantity INTEGER;
    v_current_item_id UUID;
BEGIN
    -- 1. Get the current user ID securely
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Check if item exists
    SELECT id, quantity INTO v_current_item_id, v_new_quantity
    FROM public.cart_items
    WHERE user_id = v_user_id 
      AND product_id = p_product_id 
      AND (
          (variant IS NULL AND p_variant IS NULL) 
          OR 
          (variant = p_variant)
      );

    -- 3. Upsert Logic
    IF v_current_item_id IS NOT NULL THEN
        -- Update existing
        UPDATE public.cart_items
        SET quantity = quantity + p_quantity,
            created_at = now() -- Optional: update timestamp to bump it to top if sorting by date
        WHERE id = v_current_item_id;
    ELSE
        -- Insert new
        INSERT INTO public.cart_items (user_id, product_id, quantity, variant)
        VALUES (v_user_id, p_product_id, p_quantity, p_variant);
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- CRITICAL: Grant permission to valid users to call this function
GRANT EXECUTE ON FUNCTION public.add_item_to_cart(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_item_to_cart(UUID, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.add_item_to_cart(UUID, INTEGER, TEXT) TO anon; -- Sometimes needed if logic handles anon, but here we check ID. Safe to add for flexibility if we move to guest carts later, but for now authenticated is key.
