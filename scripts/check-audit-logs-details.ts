/**
 * Check audit log details to understand why some books were analyzed and others weren't
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

async function checkAuditLogs() {
    console.log('🔍 Checking audit logs for recent books...\n');

    const isbns = [
        '9781473200166', // Sourcery
        '9781408886809', // Norse Mythology
        '9781529362916', // Unravel the Dusk
    ];

    for (const isbn of isbns) {
        // Get book
        const { data: book } = await supabase
            .from('books')
            .select('id, title, description')
            .eq('isbn', isbn)
            .single();

        if (!book) {
            console.log(`\n❌ ${isbn} - Book not found`);
            continue;
        }

        console.log(`\n📚 "${book.title}" (${isbn})`);
        console.log(`   Current description: ${book.description?.length || 0} chars`);

        // Get audit logs
        const { data: auditLogs } = await supabase
            .from('ai_audit_logs')
            .select('*')
            .eq('book_id', book.id)
            .order('created_at', { ascending: false });

        if (!auditLogs || auditLogs.length === 0) {
            console.log(`   ❌ NO AUDIT LOG - Analysis was skipped`);
            
            // Check manual handling scans
            const { data: manual } = await supabase
                .from('manual_handling_scans')
                .select('*')
                .eq('isbn', isbn)
                .order('created_at', { ascending: false })
                .limit(1);
            
            if (manual && manual.length > 0) {
                console.log(`   📋 Manual handling: ${manual[0].reason}`);
                if (manual[0].error_message) {
                    console.log(`      Error: ${manual[0].error_message}`);
                }
            }
        } else {
            const log = auditLogs[0];
            console.log(`   ✅ Has audit log: ${log.decision_type}`);
            console.log(`      Description length at analysis: ${log.description_length || 'N/A'} chars`);
            console.log(`      Used web search: ${log.used_web_search ? 'Yes' : 'No'}`);
            console.log(`      Confidence: ${log.confidence_level || 'N/A'}`);
            console.log(`      Created: ${new Date(log.created_at).toLocaleString()}`);
            console.log(`      Had thin metadata: ${log.had_thin_metadata ? 'Yes' : 'No'}`);
            if (log.ai_reasoning) {
                console.log(`      Reasoning: ${log.ai_reasoning.substring(0, 150)}...`);
            }
        }
    }
}

checkAuditLogs().catch(console.error);

