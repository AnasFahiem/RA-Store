
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function test() {
    console.log("Starting minimal test...");

    // Test OR Match (Simulating original code) with 'tac'
    console.log("Searching for 'tac' using OR...");
    const { data: orResult, error: orError } = await supabase
        .from('products')
        .select('name')
        .or(`name.ilike.%tac%,description.ilike.%tac%`);

    if (orError) console.error("OR Error:", orError);
    else console.log("OR 'tac' Result:", orResult);
}

test();
