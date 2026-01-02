/**
 * Check for books that were scanned but don't have audit logs (should be "Unknown")
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

async function checkMissingAnalysis() {
    console.log('🔍 Checking for books without audit logs (should show as "Unknown")...\n');

    // Get books created in the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: recentBooks, error: booksError } = await supabase
        .from('books')
        .select('id, title, author, isbn, created_at, description')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

    if (booksError) {
        console.error('Error fetching books:', booksError);
        return;
    }

    console.log(`Found ${recentBooks?.length || 0} books created in last 24 hours\n`);

    if (!recentBooks || recentBooks.length === 0) {
        console.log('No recent books found.');
        return;
    }

    let booksWithoutAnalysis = 0;
    let booksWithNoWarnings = 0;
    let booksWithWarnings = 0;

    for (const book of recentBooks) {
        // Check for audit logs
        const { data: auditLogs } = await supabase
            .from('ai_audit_logs')
            .select('*')
            .eq('book_id', book.id)
            .order('created_at', { ascending: false })
            .limit(1);

        // Check for warnings
        const { data: warnings } = await supabase
            .from('content_warnings')
            .select('id, category_id, severity')
            .eq('book_id', book.id);

        // Check for analysis failures
        const { data: failures } = await supabase
            .from('manual_handling_scans')
            .select('*')
            .eq('isbn', book.isbn)
            .in('reason', ['analysis_failed', 'rate_limit_exceeded'])
            .order('created_at', { ascending: false })
            .limit(1);

        const hasAnalysis = auditLogs && auditLogs.length > 0;
        const hasWarnings = warnings && warnings.length > 0;
        const hasFailures = failures && failures.length > 0;

        if (!hasAnalysis) {
            booksWithoutAnalysis++;
            console.log(`\n❓ "${book.title}" by ${book.author || 'Unknown'}`);
            console.log(`   ISBN: ${book.isbn}`);
            console.log(`   Created: ${new Date(book.created_at).toLocaleString()}`);
            console.log(`   Description: ${book.description?.length || 0} chars`);
            console.log(`   Status: NO AUDIT LOG - Should show as "Unknown"`);
            
            if (hasFailures) {
                const failure = failures[0];
                console.log(`   ⚠️  Analysis failed: ${failure.error_message}`);
                const metadata = failure.metadata as any;
                if (metadata?.is_rate_limit || failure.reason === 'rate_limit_exceeded') {
                    console.log(`   🚨 RATE LIMIT ERROR - This explains why it shows as "Comfort Read"!`);
                }
            }
            
            if (hasWarnings) {
                console.log(`   ⚠️  Has ${warnings.length} warning(s) but no audit log!`);
            }
        } else {
            const log = auditLogs[0];
            if (log.decision_type === 'no_warnings') {
                booksWithNoWarnings++;
            } else if (log.decision_type === 'warnings_generated') {
                booksWithWarnings++;
            }
        }
    }

    console.log('\n\n📊 Summary:');
    console.log(`   Total recent books: ${recentBooks.length}`);
    console.log(`   Books without analysis (should be "Unknown"): ${booksWithoutAnalysis}`);
    console.log(`   Books with "no_warnings" (Comfort Read): ${booksWithNoWarnings}`);
    console.log(`   Books with warnings: ${booksWithWarnings}`);
    
    if (booksWithoutAnalysis > 0) {
        console.log(`\n⚠️  ${booksWithoutAnalysis} book(s) are missing audit logs and should show as "Unknown"`);
        console.log(`   If they're showing as "Comfort Read", that's the bug we just fixed!`);
    }
}

checkMissingAnalysis().catch(console.error);

