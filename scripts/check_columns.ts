
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function main() {
    console.log("Checking products table columns...");

    // We can't query information_schema easily with js client for some setups, 
    // simply try to select one row with all expected columns.

    const { data, error } = await supabase
        .from('products')
        .select('id, name, price, images, category')
        .limit(1);

    if (error) {
        console.error("Select Error Message:", error.message);
        console.error("Select Error Details:", error.details);
        console.error("Select Error Hint:", error.hint);
    } else {
        console.log("Select Success:", data);
        if (data.length > 0) {
            console.log("Keys found:", Object.keys(data[0]));
        } else {
            console.log("No data to check keys, but query syntax was accepted.");
        }
    }
}

main();
