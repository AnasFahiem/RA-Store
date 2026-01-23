
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function debug() {
    console.log('--- TARGETED QUERY DEBUG ---');

    // 1. Get an existing cart item to find a valid User ID
    const { data: items } = await supabase.from('cart_items').select('user_id').limit(1);

    if (!items || items.length === 0) {
        console.log('NO CART ITEMS FOUND IN DB. Cannot test.');
        return;
    }

    const validUserId = items[0].user_id;
    console.log('Testing with Valid User ID:', validUserId);

    // 2. Run Query with JOIN
    const { data, error } = await supabase
        .from('cart_items')
        .select(`
            product_id,
            quantity,
            variant,
            products (
                name,
                base_price,
                images
            )
        `)
        .eq('user_id', validUserId);

    if (error) {
        console.error('Query Error:', error);
    } else {
        console.log('Query Result:', JSON.stringify(data, null, 2));
    }
}

debug();
