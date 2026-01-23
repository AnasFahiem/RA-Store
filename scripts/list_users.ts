
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listUsers() {
    const { data: users, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error(error);
        return;
    }
    console.log('Users:', users.users.map(u => ({ id: u.id, email: u.email })));
}

listUsers();
