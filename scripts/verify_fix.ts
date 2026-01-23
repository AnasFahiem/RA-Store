
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function test() {
    console.log("Starting verification test...");

    // Simulate the exact query used in the backend
    const query = "tac";
    console.log(`Searching for '${query}' (expecting 'Tactical Gym Gloves')...`);

    const { data, error } = await supabase
        .from('products')
        .select('id, name, base_price, images, category')
        .ilike('name', `%${query}%`)
        .limit(8);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Success! Found:", data.length, "items");
        console.log("First item:", data[0]);
        if (data[0] && 'base_price' in data[0]) {
            console.log("Verified: 'base_price' column exists and is fetched.");
        } else {
            console.error("FAILED: 'base_price' missing from result.");
        }
    }
}

test();
