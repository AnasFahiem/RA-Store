
import { Client } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

// We need the direct connection string. 
// Supabase local dev usually provides this as:
// postgresql://postgres:postgres@127.0.0.1:54322/postgres
// or via DATABASE_URL in .env (if present)
// The user's error message showed: SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
// I will try to read standard env vars or fallback.

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

async function run() {
    console.log('Connecting to DB:', connectionString.replace(/:[^:@]*@/, ':****@')); // Hide password

    const client = new Client({
        connectionString,
    });

    try {
        await client.connect();

        const command = process.argv[2];

        if (command === 'exec') {
            const sqlFile = process.argv[3];
            if (!sqlFile) throw new Error('No SQL file provided');
            const sql = fs.readFileSync(sqlFile, 'utf8');
            console.log(`Executing ${sqlFile}...`);
            await client.query(sql);
            console.log('Success.');
        } else if (command === 'query_bundles') {
            const res = await client.query('SELECT * FROM bundles');
            console.log(`Found ${res.rows.length} bundles.`);
            res.rows.forEach(b => {
                console.log(`- [${b.type}] ${b.name} (Active: ${b.is_active}) ID: ${b.id}`);
            });
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}

run();
