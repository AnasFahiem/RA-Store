-- 1. FIRST: Drop the existing constraint so we can fix the data
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Clean up data: Trim whitespace
UPDATE users SET role = TRIM(role);

-- 3. Fix invalid roles: Set anyone who isn't customer/admin/owner to 'customer'
-- NOTE: If some are 'user', we migrate them to 'customer' to be consistent
UPDATE users 
SET role = 'customer' 
WHERE role NOT IN ('customer', 'admin', 'owner') OR role IS NULL;

-- 4. Add the new constraint allowing 'customer'
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'admin', 'owner'));
