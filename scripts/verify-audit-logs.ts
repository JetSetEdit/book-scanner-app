/**
 * Verify that all analyzed books have audit logs
 * This script checks for books that should have audit logs but don't
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAuditLogs() {
    console.log('🔍 Checking for books without audit logs...\n');

    // Find books without audit logs
    const { data: booksWithoutLogs, error } = await supabase
        .from('books')
        .select(`
            id,
            isbn,
            title,
            cover_url,
            description,
            content_warnings(id),
            ai_audit_logs!left(id, decision_type)
        `)
        .is('ai_audit_logs.id', null);

    if (error) {
        console.error('Error:', error);
        process.exit(1);
    }

    if (!booksWithoutLogs || booksWithoutLogs.length === 0) {
        console.log('✅ All books have audit logs!');
        return;
    }

    console.log(`⚠️  Found ${booksWithoutLogs.length} books without audit logs:\n`);
    
    booksWithoutLogs.forEach((book: any) => {
        const warningCount = book.content_warnings?.length || 0;
        console.log(`  - ${book.title} (${book.isbn})`);
        console.log(`    Warnings: ${warningCount}, Cover: ${book.cover_url ? 'Yes' : 'No'}, Description: ${book.description ? 'Yes' : 'No'}`);
    });

    console.log('\n📝 These books should be re-scanned to generate audit logs.');
}

verifyAuditLogs().catch(console.error);

