/**
 * Backfill audit logs for specific books that are missing them
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

async function backfillMissingAuditLogs() {
    console.log('🔍 Backfilling audit logs for books missing them...\n');

    const bookIds = [
        'c9abdc81-dc7d-4a37-9fad-5dd0ab0b4640', // The Summer I Turned Pretty
        '5e6f3f2b-4eec-4262-9ce8-2f2d8522e486', // Picking Daisies on Sundays
        'd2467e7c-f0d5-4d93-8aed-4698f9e2cc3d', // Grumpy Darling
        'a79fcbc7-03cf-4d1d-8cef-b9d160abea39', // Wild Darling
    ];

    for (const bookId of bookIds) {
        // Get book info
        const { data: book } = await supabase
            .from('books')
            .select('id, isbn, title, author, description')
            .eq('id', bookId)
            .single();

        if (!book) {
            console.log(`❌ Book ${bookId} not found`);
            continue;
        }

        // Check if audit log exists
        const { data: existingLog } = await supabase
            .from('ai_audit_logs')
            .select('id')
            .eq('book_id', bookId)
            .in('decision_type', ['warnings_generated', 'no_warnings'])
            .limit(1);

        if (existingLog && existingLog.length > 0) {
            console.log(`✅ ${book.title} already has audit log`);
            continue;
        }

        // Count warnings
        const { count: warningCount } = await supabase
            .from('content_warnings')
            .select('id', { count: 'exact', head: true })
            .eq('book_id', bookId);

        console.log(`📝 Creating audit log for: ${book.title} (${warningCount || 0} warnings)`);

        const { error } = await supabase
            .from('ai_audit_logs')
            .insert({
                book_id: bookId,
                isbn: book.isbn,
                decision_type: (warningCount || 0) > 0 ? 'warnings_generated' : 'no_warnings',
                warnings_count: warningCount || 0,
                ai_reasoning: (warningCount || 0) > 0
                    ? `Backfilled audit log: This book has ${warningCount} content warning(s) but was missing an audit log. Analysis was completed previously.`
                    : `Backfilled audit log: This book has no content warnings but was missing an audit log. Analysis was completed previously.`,
                confidence_level: 'medium',
                book_title: book.title,
                book_author: book.author,
                description_length: book.description?.length || null,
                had_thin_metadata: !book.description || book.description.length < 150,
                used_web_search: false,
                model_version: 'backfilled',
                taxonomy_version: 'backfilled',
                pipeline_path: 'backfill'
            });

        if (error) {
            console.error(`    ❌ Error: ${error.message}`);
        } else {
            console.log(`    ✅ Created audit log`);
        }
    }

    console.log('\n✅ Backfill complete');
}

backfillMissingAuditLogs().catch(console.error);

