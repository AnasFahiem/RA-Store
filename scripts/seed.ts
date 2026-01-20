
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
    console.log('🌱 Seeding database...');

    // 1. Clean up existing data
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Create Users
    const passwordHash = await bcrypt.hash('2nasel5oly', 10);

    const users = [
        {
            email: 'anasfahiem18@gmail.com',
            name: 'Anas Admin',
            password_hash: passwordHash,
            role: 'admin'
        },
        {
            email: 'anasfaheim0@gmail.com',
            name: 'Anas User',
            password_hash: passwordHash,
            role: 'customer'
        }
    ];

    const { error: userError } = await supabase.from('users').insert(users);
    if (userError) console.error('Error creating users:', userError);
    else console.log('✅ Users created');

    // 3. Create Products
    const products = [
        {
            name: 'Pro Lifting Belt',
            slug: 'pro-lifting-belt',
            description: '10mm厚 leather belt for maximum support.',
            base_price: 65.00,
            category: 'Belts',
            images: ['https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2940&auto=format&fit=crop'],
            variants: [
                { name: 'S', sku: 'BELT-S' },
                { name: 'M', sku: 'BELT-M' },
                { name: 'L', sku: 'BELT-L' }
            ]
        },
        {
            name: 'Grip Strength Gloves',
            slug: 'grip-gloves',
            description: 'Advanced grip technology.',
            base_price: 25.00,
            category: 'Gloves',
            images: ['https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=2940&auto=format&fit=crop'],
            variants: [
                { name: 'M', sku: 'GLOVE-M' },
                { name: 'L', sku: 'GLOVE-L' }
            ]
        },
        {
            name: '7mm Knee Sleeves',
            slug: 'knee-sleeves',
            description: 'Neoprene sleeves for joint warmth and stability.',
            base_price: 45.00,
            category: 'Accessories',
            images: ['https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=2940&auto=format&fit=crop'],
            variants: [
                { name: 'Standard', sku: 'SLEEVE-STD' }
            ]
        },
        {
            name: 'Adjustable Hand Grip',
            slug: 'hand-grip',
            description: 'Adjustable resistance hand gripper for forearm strength.',
            base_price: 15.00,
            category: 'Accessories',
            images: ['/products/hand-grip.png'],
            variants: [{ name: 'Standard', sku: 'GRIP-STD' }]
        },
        {
            name: 'Heavy Duty Elbow Wraps',
            slug: 'elbow-wraps',
            description: 'Maximum stability for heavy pressing movements.',
            base_price: 22.00,
            category: 'Wraps',
            images: ['/products/elbow-wraps.png'],
            variants: [{ name: 'One Size', sku: 'ELBOW-WRAP' }]
        },
        {
            name: 'Powerlifting Knee Wraps',
            slug: 'knee-wraps',
            description: 'Elastic support for squatting massive weights.',
            base_price: 28.00,
            category: 'Wraps',
            images: ['/products/knee-wraps.png'],
            variants: [{ name: '2m', sku: 'KNEE-WRAP-2M' }]
        },
        {
            name: 'Lifting Straps',
            slug: 'lifting-straps',
            description: 'Cotton lifting straps to eliminate grip fatigue.',
            base_price: 12.00,
            category: 'Accessories',
            images: ['/products/straps.png'],
            variants: [{ name: 'Standard', sku: 'STRAPS-STD' }]
        },
        {
            name: 'Tactical Gym Gloves',
            slug: 'tactical-gloves',
            description: 'Full finger protection with reinforced padding.',
            base_price: 35.00,
            category: 'Gloves',
            images: ['/products/gloves-tactical.png'],
            variants: [
                { name: 'M', sku: 'TAC-GLOVE-M' },
                { name: 'L', sku: 'TAC-GLOVE-L' },
                { name: 'XL', sku: 'TAC-GLOVE-XL' }
            ]
        }
    ];

    const { data: productData, error: productError } = await supabase
        .from('products')
        .insert(products)
        .select();

    if (productError) console.error('Error creating products:', productError);
    else console.log(`✅ ${productData.length} Products created`);

    // 4. Create Bundle (Optional - if we want to test bundling logic later)
    // For now, simple products are enough to verify migration.

    console.log('🎉 Seeding complete!');
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
