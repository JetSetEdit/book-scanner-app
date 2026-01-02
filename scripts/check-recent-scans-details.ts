/**
 * Check details of recent scans to understand why they performed differently
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

async function checkRecentScans() {
    console.log('🔍 Checking recent scans for differences...\n');

    // Check the specific books from the screenshot
    const isbns = [
        '9781473200166', // Sourcery
        '9781408886809', // Norse Mythology
        '9781529362916', // Unravel the Dusk
        '9780593440872', // Book Lovers (mentioned earlier)
    ];

    for (const isbn of isbns) {
        console.log(`\n📚 ${isbn}:`);
        
        // Get book
        const { data: book } = await supabase
            .from('books')
            .select('id, title, author, isbn, cover_url, description, created_at, source')
            .eq('isbn', isbn)
            .single();

        if (!book) {
            console.log('   ❌ Book not found');
            continue;
        }

        console.log(`   Title: "${book.title}"`);
        console.log(`   Created: ${new Date(book.created_at).toLocaleString()}`);
        console.log(`   Cover: ${book.cover_url ? 'YES' : 'NO'}`);
        if (book.cover_url) {
            console.log(`   Cover URL: ${book.cover_url.substring(0, 80)}...`);
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
            auditLogs.forEach(log => {
                console.log(`     - ${log.decision_type} (${log.confidence_level || 'N/A'}) at ${new Date(log.created_at).toLocaleString()}`);
                console.log(`       Used web search: ${log.used_web_search ? 'Yes' : 'No'}`);
            });
        } else {
            console.log(`     ⚠️  NO AUDIT LOG - Should show as "Unknown"`);
        }

        // Check warnings
        const { data: warnings } = await supabase
            .from('content_warnings')
            .select('id, category_id, severity')
            .eq('book_id', book.id);

        console.log(`   Warnings: ${warnings?.length || 0}`);

        // Check for analysis failures
        const { data: failures } = await supabase
            .from('manual_handling_scans')
            .select('*')
            .eq('isbn', isbn)
            .order('created_at', { ascending: false })
            .limit(3);

        if (failures && failures.length > 0) {
            console.log(`   ⚠️  Analysis issues:`);
            failures.forEach(f => {
                console.log(`     - ${f.reason} at ${new Date(f.created_at).toLocaleString()}`);
                if (f.error_message) {
                    console.log(`       Error: ${f.error_message}`);
                }
            });
        }

        // Check scans table
        const { data: scans } = await supabase
            .from('scans')
            .select('*')
            .eq('isbn', isbn)
            .order('created_at', { ascending: false })
            .limit(1);

        if (scans && scans.length > 0) {
            console.log(`   Last scan: ${new Date(scans[0].created_at).toLocaleString()}`);
        }
    }

    console.log('\n\n📊 Analysis:');
    console.log('   Check the timestamps and audit logs above to see why they differed.');
}

checkRecentScans().catch(console.error);

