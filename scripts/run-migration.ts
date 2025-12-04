import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: '.env.local' });

async function runMigration() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;

    if (!connectionString) {
        console.error('❌ DATABASE_URL (or POSTGRES_URL/SUPABASE_DB_URL) is not defined in .env.local');
        console.log('Available keys:', Object.keys(process.env).filter(k => !k.startsWith('npm_') && !k.startsWith('NODE_')));
        process.exit(1);
    }

    // Use connection string but ensure SSL is handled correctly for Supabase (transaction mode usually requires it, or session mode)
    // Supabase usually requires ssl: { rejectUnauthorized: false } for direct connections from Node
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        const migrationFile = path.join(process.cwd(), 'supabase/migrations/20251205_enhance_content_warnings.sql');
        const sql = fs.readFileSync(migrationFile, 'utf8');

        console.log('🚀 Running migration...');
        await client.query(sql);

        console.log('✅ Migration executed successfully!');
        console.log('   - Created scans table');
        console.log('   - Added RLS policies');

    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
