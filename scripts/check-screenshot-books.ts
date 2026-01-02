/**
 * Check the books shown in the screenshot to understand differences
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

async function checkScreenshotBooks() {
    console.log('🔍 Checking books from screenshot...\n');

    // Search by title
    const titles = ['Sourcery', 'Norse Mythology', 'Unravel the Dusk'];
    
    for (const title of titles) {
        const { data: books } = await supabase
            .from('books')
            .select('id, isbn, title, author, cover_url, description, created_at, source')
            .ilike('title', `%${title}%`)
            .limit(1);

        if (!books || books.length === 0) {
            console.log(`\n❌ "${title}" - Not found`);
            continue;
        }

        const book = books[0];
        console.log(`\n📚 "${book.title}"`);
        console.log(`   ISBN: ${book.isbn}`);
        console.log(`   Created: ${new Date(book.created_at).toLocaleString()}`);
        console.log(`   Cover: ${book.cover_url ? '✅ YES' : '❌ NO'}`);
        if (book.cover_url) {
            console.log(`   Cover URL: ${book.cover_url.substring(0, 100)}...`);
            // Check if it's from Google Books or Open Library
            if (book.cover_url.includes('google')) {
                console.log(`   Cover source: Google Books`);
            } else if (book.cover_url.includes('openlibrary')) {
                console.log(`   Cover source: Open Library`);
            }
        }
        console.log(`   Description: ${book.description?.length || 0} chars`);
        console.log(`   Source: ${book.source || 'N/A'}`);

        // Check audit logs
        const { data: auditLogs } = await supabase
            .from('ai_audit_logs')
            .select('*')
            .eq('book_id', book.id)
            .order('created_at', { ascending: false });

        console.log(`   Audit logs: ${auditLogs?.length || 0}`);
        if (auditLogs && auditLogs.length > 0) {
            const log = auditLogs[0];
            console.log(`     - ${log.decision_type} (${log.confidence_level || 'N/A'})`);
            console.log(`       Created: ${new Date(log.created_at).toLocaleString()}`);
            console.log(`       Web search: ${log.used_web_search ? 'Yes' : 'No'}`);
            console.log(`       Reasoning: ${log.ai_reasoning?.substring(0, 100)}...`);
        } else {
            console.log(`     ⚠️  NO AUDIT LOG - Should show as "Unknown"`);
        }

        // Check warnings
        const { data: warnings } = await supabase
            .from('content_warnings')
            .select('id, category_id, severity')
            .eq('book_id', book.id);

        console.log(`   Warnings: ${warnings?.length || 0}`);

        // Check for candidates (if multiple were returned)
        const { data: ambiguousScans } = await supabase
            .from('ambiguous_scans')
            .select('*')
            .eq('isbn', book.isbn)
            .order('created_at', { ascending: false })
            .limit(1);

        if (ambiguousScans && ambiguousScans.length > 0) {
            const ambiguous = ambiguousScans[0];
            const candidates = ambiguous.candidates as any[];
            console.log(`   ⚠️  Had ${candidates?.length || 0} candidates (ambiguous scan)`);
            if (candidates) {
                candidates.forEach((c, i) => {
                    console.log(`     Candidate ${i + 1}: ${c.title} (${c.source}) - Cover: ${c.cover_url ? 'YES' : 'NO'}`);
                });
            }
        }

        // Check for analysis failures
        const { data: failures } = await supabase
            .from('manual_handling_scans')
            .select('*')
            .eq('isbn', book.isbn)
            .order('created_at', { ascending: false })
            .limit(1);

        if (failures && failures.length > 0) {
            const failure = failures[0];
            console.log(`   ⚠️  Analysis issue: ${failure.reason}`);
            if (failure.error_message) {
                console.log(`       Error: ${failure.error_message}`);
            }
        }
    }

    console.log('\n\n📊 Summary:');
    console.log('   Compare the timestamps, covers, and audit logs to see why they differed.');
}

checkScreenshotBooks().catch(console.error);

