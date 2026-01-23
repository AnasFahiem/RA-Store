
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function check() {
    console.log("Checking more columns and tables...");

    // Check orders columns
    const orderCols = [
        'full_name', 'recipient_name', 'contact_number', 'mobile', 'email_address',
        'details', 'metadata', 'info',
        'customer' // maybe a jsonb column?
    ];
    for (const c of orderCols) {
        const { error } = await supabase.from('orders').select(c).limit(1);
        console.log(`Orders Column '${c}': ${error ? 'MISSING' : 'OK'}`);
    }

    // Check table existence by selecting * limit 0
    const tables = ['order_items', 'addresses'];
    for (const t of tables) {
        const { error } = await supabase.from(t).select('*').limit(1);
        console.log(`Table '${t}': ${error ? 'ERROR (' + error.message + ')' : 'OK'}`);
    }
}

check();
