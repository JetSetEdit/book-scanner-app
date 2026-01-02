/**
 * Check books that show as "Comfort Read" to see if they should have warnings
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

async function checkComfortReadBooks() {
    console.log('🔍 Checking books marked as "Comfort Read" (no_warnings)...\n');

    // Get all books with "no_warnings" audit logs
    const { data: noWarningsLogs, error } = await supabase
        .from('ai_audit_logs')
        .select(`
            *,
            books!inner(id, title, author, isbn, description)
        `)
        .eq('decision_type', 'no_warnings')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${noWarningsLogs?.length || 0} books with "no_warnings" audit logs\n`);

    if (!noWarningsLogs || noWarningsLogs.length === 0) {
        console.log('No books found.');
        return;
    }

    // Check each book
    for (const log of noWarningsLogs) {
        const book = log.books as any;
        
        // Check if book has warnings (shouldn't if "no_warnings" is correct)
        const { data: warnings } = await supabase
            .from('content_warnings')
            .select('id, category_id, severity, description')
            .eq('book_id', book.id);

        // Check if there are any analysis failures for this book
        const { data: failures } = await supabase
            .from('manual_handling_scans')
            .select('*')
            .eq('isbn', book.isbn)
            .eq('reason', 'analysis_failed')
            .order('created_at', { ascending: false })
            .limit(1);

        console.log(`\n📚 "${book.title}" by ${book.author || 'Unknown'}`);
        console.log(`   ISBN: ${book.isbn}`);
        console.log(`   Audit log date: ${new Date(log.created_at).toLocaleString()}`);
        console.log(`   Confidence: ${log.confidence_level || 'N/A'}`);
        console.log(`   Used web search: ${log.used_web_search ? 'Yes' : 'No'}`);
        console.log(`   Description length: ${book.description?.length || 0} chars`);
        
        if (warnings && warnings.length > 0) {
            console.log(`   ⚠️  ISSUE: Has ${warnings.length} warning(s) but marked as "no_warnings"!`);
            warnings.forEach(w => {
                console.log(`      - ${w.severity}: ${w.category_id} - ${w.description?.substring(0, 60)}...`);
            });
        } else {
            console.log(`   ✅ No warnings found (consistent with audit log)`);
        }

        if (failures && failures.length > 0) {
            const failure = failures[0];
            console.log(`   ⚠️  ANALYSIS FAILURE DETECTED:`);
            console.log(`      - Date: ${new Date(failure.created_at).toLocaleString()}`);
            console.log(`      - Error: ${failure.error_message}`);
            const metadata = failure.metadata as any;
            if (metadata?.is_rate_limit) {
                console.log(`      - ⚠️  RATE LIMIT ERROR`);
            }
        }

        // Check reasoning
        if (log.ai_reasoning) {
            const reasoning = log.ai_reasoning.toLowerCase();
            if (reasoning.includes('rate limit') || reasoning.includes('failed') || reasoning.includes('error')) {
                console.log(`   ⚠️  SUSPICIOUS: Reasoning mentions errors/failures:`);
                console.log(`      ${log.ai_reasoning.substring(0, 150)}...`);
            }
        }
    }

    console.log('\n\n📊 Summary:');
    const booksWithWarnings = noWarningsLogs.filter(log => {
        // We'll check this in the loop above
        return false; // Placeholder
    });
    
    console.log(`   Total "no_warnings" books: ${noWarningsLogs.length}`);
    console.log(`   Check each book above for issues`);
}

checkComfortReadBooks().catch(console.error);

