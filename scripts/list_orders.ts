
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listOrders() {
    console.log("Attempting to list orders...");
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .limit(1);

    if (error) {
        console.error("List orders FAILED:", error);
    } else {
        console.log("List orders result:", JSON.stringify(data, null, 2));
    }
}

listOrders();
