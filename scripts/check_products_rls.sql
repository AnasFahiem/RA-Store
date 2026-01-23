SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'products';

SELECT * FROM pg_policies WHERE tablename = 'products';
