
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOrderCreation() {
    console.log("Attempting to create a test order with JSONB columns...");

    const testOrder = {
        total_amount: 150,
        status: 'pending',
        shipping_address: {
            name: "Test User",
            email: "test@example.com",
            phone: "1234567890",
            street: "123 Test St",
            city: "Test City"
        },
        items: [
            {
                product_id: "some-uuid",
                name: "Test Item",
                price: 50,
                quantity: 3
            }
        ]
    };

    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(testOrder)
        .select()
        .single();

    if (orderError) {
        console.error("Order creation FAILED:");
        console.error("Message:", orderError.message);
        console.error("Details:", orderError.details);
    } else {
        console.log("Order created SUCCESSFULLY:");
        console.log(JSON.stringify(order, null, 2));
    }
}

testOrderCreation();
