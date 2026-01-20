-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS TABLE
create table public.users (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  name text not null,
  password_hash text not null, -- Storing hash here since we use custom auth logic
  role text default 'customer' check (role in ('admin', 'customer')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PRODUCTS TABLE
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  description text,
  base_price numeric not null,
  category text,
  images text[], -- Array of strings
  is_bundle boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PRODUCT VARIANTS (JSONB for flexibility like MongoDB)
alter table public.products add column variants jsonb default '[]'::jsonb;
-- Expected structure: [{ name: "S", sku: "...", priceAndStock: [...] }]

-- BUNDLE ITEMS (Many-to-Many relationship handled via array for simplicity in this MVP, or join table)
alter table public.products add column bundle_items uuid[]; 

-- ORDERS TABLE
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id),
  total_amount numeric not null,
  status text default 'Pending',
  shipping_address jsonb,
  payment_status text default 'Pending',
  tracking_number text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ORDER ITEMS (Stored as JSONB to snapshot price/variant at time of purchase)
alter table public.orders add column items jsonb default '[]'::jsonb;
