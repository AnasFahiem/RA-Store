-- Create hero_slides table
create table if not exists hero_slides (
  id uuid default gen_random_uuid() primary key,
  image_url text not null,
  sort_order integer default 0,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table hero_slides enable row level security;

-- Create policies

-- Allow public read access (needed for storefront)
create policy "Enable read access for all users"
  on hero_slides for select
  using ( true );

-- Allow authenticated users (admins) to insert
create policy "Enable insert for authenticated users only"
  on hero_slides for insert
  with check ( auth.role() = 'authenticated' );

-- Allow authenticated users (admins) to update
create policy "Enable update for authenticated users only"
  on hero_slides for update
  using ( auth.role() = 'authenticated' );

-- Allow authenticated users (admins) to delete
create policy "Enable delete for authenticated users only"
  on hero_slides for delete
  using ( auth.role() = 'authenticated' );

-- Create storage bucket for hero images if it doesn't exist
-- Note: This usually needs to be done via dashboard or specific storage API, 
-- but we can try to insert into storage.buckets if permissions allow.
-- For now, we will assume usage of an existing bucket 'products' or a new 'hero' bucket created via dashboard.
