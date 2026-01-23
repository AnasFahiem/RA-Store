
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function check() {
    console.log("Checking columns individually for 'orders' table...");
    const cols = [
        'id', 'created_at', // standard
        'customer_name', 'customer_email', 'customer_phone', 'shipping_address', 'total_amount', 'status', // option A
        'name', 'email', 'phone', 'address', 'total', // option B
        'user_id', 'items', 'order_items' // other
    ];
    for (const c of cols) {
        const { error } = await supabase.from('orders').select(c).limit(1);
        console.log(`Column '${c}': ${error ? 'MISSING (' + error.message + ')' : 'OK'}`);
    }
}

check();
