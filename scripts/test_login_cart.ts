const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function testSessionAndCart() {
    console.log('\n=== SIMULATING POST-LOGIN SCENARIO ===\n');

    // Get the first user (simulating logged-in user)
    const { data: users } = await supabase.from('users').select('id, email').limit(1);

    if (!users || users.length === 0) {
        console.log('No users found');
        return;
    }

    const testUser = users[0];
    console.log('Test User ID:', testUser.id);
    console.log('Test User Email:', testUser.email);

    // Check if this user has cart items
    console.log('\nQuerying cart_items for this user...');
    const { data: cartItems, error } = await supabase
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
        .eq('user_id', testUser.id);

    if (error) {
        console.error('ERROR:', error);
    } else {
        console.log('\nCart Items Found:', cartItems.length);
        if (cartItems.length > 0) {
            console.log('Items:', JSON.stringify(cartItems, null, 2));
        }
    }

    // Check session table to see if there's a valid session
    console.log('\n=== SESSION CHECK ===');
    console.log('Note: The custom auth uses JWT cookies, not a sessions table.');
    console.log('The session cookie should contain:', { userId: testUser.id });
}

testSessionAndCart();
