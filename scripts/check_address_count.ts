
import 'dotenv/config';
import { supabaseAdmin } from '../lib/supabase';

async function checkAddresses() {
    const { count, error } = await supabaseAdmin
        .from('addresses')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Total addresses in DB:', count);
    }
}

checkAddresses();
