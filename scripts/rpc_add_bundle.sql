
-- Function to handle adding a bundle to cart
-- Handles incrementing quantity if exists, or inserting if new.
CREATE OR REPLACE FUNCTION public.handle_add_bundle_to_cart(
  p_user_id UUID,
  p_bundle_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
  v_existing_qty INTEGER;
  v_new_qty INTEGER;
BEGIN
  -- Loop through all items in the bundle
  FOR v_item IN 
    SELECT product_id, quantity 
    FROM public.bundle_items 
    WHERE bundle_id = p_bundle_id
  LOOP
    -- Check if this specific item (product + bundle_id context) exists in cart
    SELECT quantity INTO v_existing_qty
    FROM public.cart_items
    WHERE user_id = p_user_id
      AND bundle_id = p_bundle_id
      AND product_id = v_item.product_id
      AND (variant IS NULL); -- Assuming null variants for bundles for now

    IF v_existing_qty IS NOT NULL THEN
      -- Update existing
      v_new_qty := v_existing_qty + v_item.quantity;
      
      UPDATE public.cart_items
      SET quantity = v_new_qty
      WHERE user_id = p_user_id
        AND bundle_id = p_bundle_id
        AND product_id = v_item.product_id
        AND (variant IS NULL);
    ELSE
      -- Insert new
      INSERT INTO public.cart_items (user_id, product_id, bundle_id, quantity, variant)
      VALUES (p_user_id, v_item.product_id, p_bundle_id, v_item.quantity, NULL);
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
