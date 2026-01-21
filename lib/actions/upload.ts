'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifySession } from '@/lib/auth/session';

export async function uploadImage(formData: FormData) {
    try {
        console.log('Server Action: uploadImage started');

        // 1. Verify Authentication & Role
        const session = await verifySession();
        console.log('Server Action: Session verified, Role:', session.role);

        if (session.role !== 'admin') {
            console.error('Server Action: Unauthorized role');
            return { error: 'Unauthorized' };
        }

        const file = formData.get('file') as File;
        if (!file) {
            console.error('Server Action: No file found in FormData');
            return { error: 'No file provided' };
        }
        console.log(`Server Action: File received - Name: ${file.name}, Size: ${file.size}, Type: ${file.type}`);

        // 2. Ensure Bucket Exists (Self-Healing)
        const { data: buckets } = await supabaseAdmin.storage.listBuckets();
        const productsBucket = buckets?.find(b => b.name === 'products');

        if (!productsBucket) {
            console.log('Server Action: Bucket "products" not found. Creating...');
            const { error: createError } = await supabaseAdmin.storage.createBucket('products', {
                public: true,
                fileSizeLimit: 10485760, // 10MB
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
            });
            if (createError) {
                console.error('Server Action: Failed to create bucket:', createError);
                return { error: 'Failed to initialize storage' };
            }
        }

        // 3. Prepare File
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // 4. Upload using Admin Client (Bypasses RLS)
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabaseAdmin.storage
            .from('products')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase Upload Error:', uploadError);
            return { error: 'Upload failed' };
        }

        // 4. Get Public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('products')
            .getPublicUrl(filePath);

        return { url: publicUrl };

    } catch (error) {
        console.error('Server Upload Action Error:', error);
        return { error: 'Internal server error' };
    }
}
