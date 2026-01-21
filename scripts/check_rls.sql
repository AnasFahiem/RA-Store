SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'cart_items';
SELECT schemaname, tablename, policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'cart_items';
