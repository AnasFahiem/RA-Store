-- Run this in your Supabase SQL Editor

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS name_ar TEXT,
ADD COLUMN IF NOT EXISTS description_ar TEXT,
ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT '{}';

-- Optional: If you want to backfill existing rows
-- UPDATE products SET name_ar = name, description_ar = description WHERE name_ar IS NULL;
