/**
 * Backfill audit logs for books with 0 warnings but no audit log
 * These books were analyzed and found safe but the audit log wasn't created
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

async function backfillNoWarningsAuditLogs() {
    console.log('🔍 Finding books with 0 warnings but no audit logs...\n');

    // Find books with no warnings and no audit logs
    const { data: books, error } = await supabase
        .from('books')
        .select(`
            id,
            isbn,
            title,
            author,
            description,
            content_warnings!left(id)
        `);

    if (error) {
        console.error('Error:', error);
        process.exit(1);
    }

    if (!books || books.length === 0) {
        console.log('✅ No books found');
        return;
    }

    // Filter to books with 0 warnings
    const booksWithNoWarnings = books.filter(book => 
        !book.content_warnings || book.content_warnings.length === 0
    );

    // Check which ones don't have audit logs
    const booksToBackfill = [];
    for (const book of booksWithNoWarnings) {
        const { data: auditLogs } = await supabase
            .from('ai_audit_logs')
            .select('id')
            .eq('book_id', book.id)
            .in('decision_type', ['warnings_generated', 'no_warnings'])
            .limit(1);

        if (!auditLogs || auditLogs.length === 0) {
            booksToBackfill.push(book);
        }
    }

    if (booksToBackfill.length === 0) {
        console.log('✅ All books with 0 warnings have audit logs!');
        return;
    }

    console.log(`📝 Found ${booksToBackfill.length} books with 0 warnings but no audit logs:\n`);

    let created = 0;
    for (const book of booksToBackfill) {
        console.log(`  Creating audit log for: ${book.title}`);

        const { error: insertError } = await supabase
            .from('ai_audit_logs')
            .insert({
                book_id: book.id,
                isbn: book.isbn,
                decision_type: 'no_warnings',
                warnings_count: 0,
                ai_reasoning: `Backfilled audit log: This book has no content warnings. Analysis was completed previously.`,
                confidence_level: 'medium', // Medium confidence since we're backfilling
                book_title: book.title,
                book_author: book.author,
                description_length: book.description?.length || null,
                had_thin_metadata: !book.description || book.description.length < 150,
                used_web_search: false,
                model_version: 'backfilled',
                taxonomy_version: 'backfilled',
                pipeline_path: 'backfill'
            });

        if (insertError) {
            console.error(`    ❌ Error: ${insertError.message}`);
        } else {
            created++;
            console.log(`    ✅ Created audit log`);
        }
    }

    console.log(`\n✅ Successfully created ${created} audit logs`);
}

backfillNoWarningsAuditLogs().catch(console.error);

