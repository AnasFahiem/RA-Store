
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function check() {
    console.log("Checking columns individually...");
    const cols = ['price', 'images', 'category', 'items_in_stock', 'sizes', 'description'];
    for (const c of cols) {
        const { error } = await supabase.from('products').select(c).limit(1);
        console.log(`Column '${c}': ${error ? 'MISSING (' + error.message + ')' : 'OK'}`);
    }
}

check();
