
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('--- Key Check ---');
console.log('URL:', url);
console.log('Anon Key length:', anon?.length);
console.log('Service Key length:', service?.length);
console.log('Are keys identical?', anon === service);

if (anon === service) {
    console.error('CRITICAL: Service Role Key is the SAME as Anon Key. Admin client effectively has no privileges!');
}

const supabase = createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function debug() {
    console.log('\n--- Fetch All Bundles (Service Role) ---');
    const { data: bundles, error } = await supabase.from('bundles').select('id, name, type');
    if (error) console.error(error);
    else {
        console.log(`Found ${bundles.length} bundles.`);
        bundles.forEach(b => console.log(`- [${b.type}] ${b.name} (${b.id})`));
    }

    console.log('\n--- Check RLS Policies ---');
    // We can't query pg_policies easily via JS client unless RLS is disabled on it or RPC.
    // We will infer likely policy issue if query above fails (if keys are identical).
}

debug();
