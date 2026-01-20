
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAuth() {
    const email = 'anasfahiem18@gmail.com';
    const password = '2nasel5oly';

    console.log(`Checking user: ${email}`);

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error) {
        console.error('Error fetching user:', error);
        return;
    }

    if (!user) {
        console.error('User not found!');
        return;
    }

    console.log('User found:', user.email);
    console.log('Stored Hash:', user.password_hash);

    const isValid = await bcrypt.compare(password, user.password_hash);
    console.log(`Password '2nasel5oly' valid? ${isValid}`);
}

checkAuth();
