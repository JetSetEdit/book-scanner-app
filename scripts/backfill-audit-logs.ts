/**
 * Backfill audit logs for books that have warnings but no audit log
 * These books were clearly analyzed but the audit log wasn't created
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

async function backfillAuditLogs() {
    console.log('🔍 Finding books with warnings but no audit logs...\n');

    // Find books with warnings but no audit logs
    const { data: books, error } = await supabase
        .from('books')
        .select(`
            id,
            isbn,
            title,
            author,
            description,
            content_warnings(id, severity)
        `)
        .not('content_warnings.id', 'is', null);

    if (error) {
        console.error('Error:', error);
        process.exit(1);
    }

    if (!books || books.length === 0) {
        console.log('✅ No books found with warnings');
        return;
    }

    // Check which ones don't have audit logs
    const booksToBackfill = [];
    for (const book of books) {
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
        console.log('✅ All books with warnings have audit logs!');
        return;
    }

    console.log(`📝 Found ${booksToBackfill.length} books with warnings but no audit logs:\n`);

    let created = 0;
    for (const book of booksToBackfill) {
        const warnings = book.content_warnings || [];
        const warningCount = warnings.length;

        console.log(`  Creating audit log for: ${book.title} (${warningCount} warnings)`);

        const { error: insertError } = await supabase
            .from('ai_audit_logs')
            .insert({
                book_id: book.id,
                isbn: book.isbn,
                decision_type: 'warnings_generated',
                warnings_count: warningCount,
                ai_reasoning: `Backfilled audit log: This book has ${warningCount} content warning(s) but was missing an audit log. Analysis was completed previously.`,
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

backfillAuditLogs().catch(console.error);

