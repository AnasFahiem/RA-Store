-- Nuke it
DROP TABLE IF EXISTS public.cart_items CASCADE;

-- Recreate
CREATE TABLE public.cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    product_id UUID REFERENCES public.products NOT NULL,
    quantity INTEGER DEFAULT 1,
    variant TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, product_id, variant)
);

-- Secure it
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Policy: Select (View Own)
CREATE POLICY "Users can view their own cart items" 
ON public.cart_items FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Insert (Add Own)
CREATE POLICY "Users can insert their own cart items" 
ON public.cart_items FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Update (Edit Own)
CREATE POLICY "Users can update their own cart items" 
ON public.cart_items FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Delete (Remove Own)
CREATE POLICY "Users can delete their own cart items" 
ON public.cart_items FOR DELETE 
USING (auth.uid() = user_id);
