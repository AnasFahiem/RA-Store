import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Connecting to Supabase URL:', supabaseUrl);
// Hide key in logs, show first few chars
console.log('Using Service Role Key:', supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listBuckets() {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error('Error listing buckets:', error);
    } else {
        console.log('Buckets found:', data.map(b => `${b.name} (public: ${b.public})`));

        // Specific check
        const productsBucket = data.find(b => b.name === 'products');
        if (productsBucket) {
            console.log('✅ products bucket exists.');
        } else {
            console.error('❌ products bucket MISSING.');
        }
    }
}

listBuckets();
