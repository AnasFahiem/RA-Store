SELECT subheading, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'products';
