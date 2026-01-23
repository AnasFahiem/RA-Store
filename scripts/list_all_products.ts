
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function main() {
    console.log("Fetching all products...");

    const { data, error } = await supabase
        .from('products')
        .select('id, name, description');

    if (error) {
        console.error("Error fetching products:", error);
        return;
    }

    console.log(`Found ${data.length} products:`);
    data.forEach(p => {
        console.log(`- Name: "${p.name}"`);
        console.log(`  Desc: "${p.description?.substring(0, 50)}..."`);
    });
}

main();
