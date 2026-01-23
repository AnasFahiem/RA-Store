-- 1. Enable Row Level Security on the table
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- 2. Clean up any existing policies to ensure a fresh start
DROP POLICY IF EXISTS "Users can view their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON public.cart_items;

DROP POLICY IF EXISTS "Enable individual access" ON public.cart_items; -- Remove potential bad policies

-- 3. Create strict policies for each operation

-- SELECT: Only allow users to see their own items
CREATE POLICY "Users can view their own cart items"
ON public.cart_items
FOR SELECT
USING (auth.uid() = user_id);

-- INSERT: Only allow users to insert items for themselves
-- The WITH CHECK clause ensures the new row's user_id matches the authenticated user
CREATE POLICY "Users can insert their own cart items"
ON public.cart_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Only allow users to update their own items
CREATE POLICY "Users can update their own cart items"
ON public.cart_items
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Only allow users to delete their own items
CREATE POLICY "Users can delete their own cart items"
ON public.cart_items
FOR DELETE
USING (auth.uid() = user_id);
