
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Use Service Role to bypass RLS and ensure we see everything
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

async function check() {
    console.log('Checking for admin_fixed bundles...');

    // 1. Check strict filter
    const { data: strictData, error: strictError } = await supabaseAdmin
        .from('bundles')
        .select('id, name, type, is_active, image')
        .eq('type', 'admin_fixed');

    if (strictError) console.error('Strict Fetch Error:', strictError);
    else {
        console.log(`Strict Fetch found ${strictData?.length} bundles:`);
        console.log(strictData);
    }

    // 2. Check all bundles to see if there's a typo or mismatch
    const { data: allData } = await supabaseAdmin
        .from('bundles')
        .select('id, name, type, is_active')
        .limit(10);

    console.log('Sample of all bundles:', allData);
}

check();
