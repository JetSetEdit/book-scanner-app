import { Client } from 'pg';
import * as dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: '.env.local' });

async function checkStats() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;

    if (!connectionString) {
        console.error('❌ DATABASE_URL is not defined');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // 1. Table Counts
        console.log('--- Table Counts ---');
        const tables = ['books', 'content_warnings', 'scans', 'ai_audit_logs', 'author_context'];
        for (const table of tables) {
            try {
                const res = await client.query(`SELECT count(*) FROM ${table}`);
                console.log(`${table}: ${res.rows[0].count}`);
            } catch (e) {
                console.log(`${table}: [Table not found or error]`);
            }
        }

        // 2. Books with missing/placeholder covers
        console.log('\n--- Cover Image Issues ---');
        const badCovers = await client.query(`
      SELECT count(*) FROM books 
      WHERE cover_url IS NULL 
         OR cover_url = '' 
         OR cover_url LIKE '%googleusercontent%' AND cover_url NOT LIKE '%zoom%'
    `);
        console.log(`Books with potential cover issues: ${badCovers.rows[0].count}`);

        // Sample of bad covers
        const badCoverSample = await client.query(`
      SELECT title, cover_url FROM books 
      WHERE cover_url IS NULL OR cover_url = ''
      LIMIT 5
    `);
        if (badCoverSample.rows.length > 0) {
            console.log('Sample missing covers:', badCoverSample.rows);
        }

        // 3. Books with thin metadata
        console.log('\n--- Metadata Quality ---');
        const thinBooks = await client.query(`
      SELECT count(*) FROM books 
      WHERE description IS NULL 
         OR length(description) < 50
    `);
        console.log(`Books with missing/short description: ${thinBooks.rows[0].count}`);

        // 4. Content Warnings Stats
        console.log('\n--- Content Warnings ---');
        const warningsStats = await client.query(`
      SELECT severity, count(*) FROM content_warnings GROUP BY severity
    `);
        console.log('Severity distribution:', warningsStats.rows);

    } catch (err) {
        console.error('❌ Analysis failed:', err);
    } finally {
        await client.end();
    }
}

checkStats();
