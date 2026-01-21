import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://muxlwgnesppkvzvqmbne.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11eGx3Z25lc3Bwa3Z6dnFtYm5lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkwOTI1MCwiZXhwIjoyMDg0NDg1MjUwfQ.NZxW50kKT3XuYgDGic1nzCj4JlReYMZ5rPB2I_v4BAk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
    console.log('Checking/Creating products bucket...');

    // Try to retrieve it first to check existence
    const { data: bucket, error: getError } = await supabase.storage.getBucket('products');

    if (bucket) {
        console.log('Bucket "products" already exists.');
        if (!bucket.public) {
            console.log('Bucket is not public. Updating...');
            const { error: updateError } = await supabase.storage.updateBucket('products', {
                public: true
            });
            if (updateError) console.error('Failed to update bucket public status:', updateError);
            else console.log('Bucket updated to public.');
        } else {
            console.log('Bucket is already public.');
        }
        return;
    }

    // If not found, create it
    const { data, error } = await supabase
        .storage
        .createBucket('products', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
        });

    if (error) {
        if (error.message.includes('already exists')) {
            // Race condition handling
            console.log('Bucket already exists (race condition).');
        } else {
            console.error('Error creating bucket:', error);
        }
    } else {
        console.log('Bucket created successfully:', data);
    }
}

createBucket();
