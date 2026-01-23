
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSql() {
    const sqlFilePath = process.argv[2];
    if (!sqlFilePath) {
        console.error('Please provide a SQL file path');
        process.exit(1);
    }

    const fullPath = path.resolve(process.cwd(), sqlFilePath);
    if (!fs.existsSync(fullPath)) {
        console.error(`File not found: ${fullPath}`);
        process.exit(1);
    }

    console.log(`Executing SQL from ${sqlFilePath}...`);
    const sqlContent = fs.readFileSync(fullPath, 'utf8');

    // Supabase JS client doesn't support raw SQL execution directly on the public interface often,
    // but the `postgres` library or `pg` is usually needed for raw SQL if not using RPC.
    // HOWEVER, for this environment, often the user has `pg` or we can try to use storage or just specific RPCs.
    // Wait, the user has `postgres` connection string in previous errors?
    // Actually, `supabase-js` doesn't allow arbitrary SQL execution unless there's an RPC for it.
    // Check if there is an RPC `exec_sql` or similar? 
    // If not, we might need to use `pg` directly if available or `postgres.js`.
    // Checking package.json... `mongodb` is there, but no `pg`.
    // BUT `seed.ts` uses `supabase-js` to insert data. 
    // `create_bundle_tables.sql` was likely run by the user or an agent with access to the db shell.
    // I can try to use a "magic" RPC if I created one, but I didn't.

    // Alternative: Use the provided `create_cart_table.sql` logic but via JS API calls for simple schema updates?
    // No, DDL (ALTER TABLE) requires SQL.

    // Let's assume I can't run raw SQL via `supabase-js` without an RPC.
    // I will try to use the `pg` driver if I can install it, or `npx` it?
    // Or I can try to find if there is a `run_sql` tool available in the environment... no.

    // WAIT! I see `run_sql_placeholder.ts` in the file list. Maybe that has a pattern?
    // Let's check `run_sql_placeholder.ts`.

    console.log("Checking for 'exec_sql' RPC...");
    const { error } = await supabase.rpc('exec_sql', { sql_query: sqlContent });

    if (error) {
        console.error('RPC exec_sql failed (it might not exist):', error);
        console.log('Attempting to use direct connection if possible, strictly for this environment? No.');
        // Since I cannot run DDL via supabase-js client directly without an RPC,
        // and I don't have `pg` installed, I am blocked on running RAW SQL files unless I use a workaround.

        // workaround: Create a temporary RPC via the dashboard? No access.
        // workaround: The user has `run_command` capability. 
        // I tried `docker` and it failed. 
        // Does the user have `psql`?

        // Let's try to query the bundles first using basic JS to verify content.
    } else {
        console.log('SQL executed successfully via RPC.');
    }
}

// Just checking DB content for debugging
async function checkBundles() {
    console.log('Checking bundles table...');
    const { data, error } = await supabase
        .from('bundles')
        .select('*');

    if (error) console.error('Error fetching bundles:', error);
    else {
        console.log(`Found ${data?.length} bundles.`);
        console.log(JSON.stringify(data, null, 2));
    }
}

// Determine mode
const command = process.argv[2];

if (command === 'check_bundles') {
    checkBundles();
} else if (command) {
    runSql();
} else {
    console.log('Usage: npx tsx scripts/debug_bundles.ts [check_bundles | <sql_file_path>]');
}
