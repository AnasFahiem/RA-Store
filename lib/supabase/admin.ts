import 'server-only';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Lazy initialization to prevent build-time crashes if keys are missing
export const createAdminClient = () => {
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};
