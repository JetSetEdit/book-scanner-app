/**
 * Check for rate limit issues that caused false "Comfort Read" results
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

async function checkRateLimitIssues() {
    console.log('🔍 Checking for rate limit issues...\n');

    // 1. Check manual_handling_scans for rate limit errors
    console.log('1. Checking manual_handling_scans for rate limit errors...');
    const { data: rateLimitScans, error: rateLimitError } = await supabase
        .from('manual_handling_scans')
        .select('*')
        .or('reason.eq.rate_limit_exceeded,metadata->is_rate_limit.eq.true')
        .order('created_at', { ascending: false })
        .limit(10);

    if (rateLimitError) {
        console.error('Error fetching rate limit scans:', rateLimitError);
    } else {
        console.log(`   Found ${rateLimitScans?.length || 0} rate limit errors`);
        if (rateLimitScans && rateLimitScans.length > 0) {
            console.log('   Recent rate limit errors:');
            rateLimitScans.forEach(scan => {
                console.log(`   - ISBN: ${scan.isbn}, Date: ${new Date(scan.created_at).toLocaleString()}`);
                console.log(`     Error: ${scan.error_message || 'N/A'}`);
            });
        }
    }

    // 2. Check for books with "no_warnings" audit logs but no actual warnings
    console.log('\n2. Checking for books with "no_warnings" but potentially failed analysis...');
    const { data: noWarningsLogs, error: noWarningsError } = await supabase
        .from('ai_audit_logs')
        .select('*, books(title, isbn)')
        .eq('decision_type', 'no_warnings')
        .order('created_at', { ascending: false })
        .limit(20);

    if (noWarningsError) {
        console.error('Error fetching no_warnings logs:', noWarningsError);
    } else {
        console.log(`   Found ${noWarningsLogs?.length || 0} "no_warnings" audit logs`);
        
        // Check if any of these books have content warnings (shouldn't if analysis was correct)
        if (noWarningsLogs && noWarningsLogs.length > 0) {
            console.log('\n   Checking if these books actually have warnings...');
            for (const log of noWarningsLogs.slice(0, 10)) {
                if (!log.book_id) continue;
                
                const { data: warnings } = await supabase
                    .from('content_warnings')
                    .select('id, category_id, severity')
                    .eq('book_id', log.book_id)
                    .limit(1);

                const book = log.books as any;
                if (warnings && warnings.length > 0) {
                    console.log(`   ⚠️  ISSUE: "${book?.title}" (ISBN: ${book?.isbn || log.isbn})`);
                    console.log(`      - Has "no_warnings" audit log but actually has ${warnings.length} warning(s)`);
                    console.log(`      - Audit log date: ${new Date(log.created_at).toLocaleString()}`);
                }
            }
        }
    }

    // 3. Check for books with "no_warnings" but low confidence or web search issues
    console.log('\n3. Checking "no_warnings" logs for suspicious patterns...');
    const { data: suspiciousLogs, error: suspiciousError } = await supabase
        .from('ai_audit_logs')
        .select('*, books(title, isbn)')
        .eq('decision_type', 'no_warnings')
        .or('confidence_level.eq.low,confidence_level.eq.medium')
        .order('created_at', { ascending: false })
        .limit(10);

    if (suspiciousError) {
        console.error('Error fetching suspicious logs:', suspiciousError);
    } else {
        console.log(`   Found ${suspiciousLogs?.length || 0} "no_warnings" with low/medium confidence`);
        if (suspiciousLogs && suspiciousLogs.length > 0) {
            console.log('   These might be rate-limited or failed analyses:');
            suspiciousLogs.forEach(log => {
                const book = log.books as any;
                console.log(`   - "${book?.title}" (ISBN: ${book?.isbn || log.isbn})`);
                console.log(`     Confidence: ${log.confidence_level}, Date: ${new Date(log.created_at).toLocaleString()}`);
                console.log(`     Reasoning: ${log.ai_reasoning?.substring(0, 100)}...`);
            });
        }
    }

    // 4. Check recent scans for analysis failures
    console.log('\n4. Checking recent manual_handling_scans for analysis failures...');
    const { data: failedScans, error: failedError } = await supabase
        .from('manual_handling_scans')
        .select('*')
        .eq('reason', 'analysis_failed')
        .order('created_at', { ascending: false })
        .limit(10);

    if (failedError) {
        console.error('Error fetching failed scans:', failedError);
    } else {
        console.log(`   Found ${failedScans?.length || 0} analysis failures`);
        if (failedScans && failedScans.length > 0) {
            console.log('   Recent analysis failures:');
            failedScans.forEach(scan => {
                console.log(`   - ISBN: ${scan.isbn}, Date: ${new Date(scan.created_at).toLocaleString()}`);
                console.log(`     Error: ${scan.error_message || 'N/A'}`);
                const metadata = scan.metadata as any;
                if (metadata?.is_rate_limit) {
                    console.log(`     ⚠️  RATE LIMIT DETECTED`);
                }
            });
        }
    }

    // 5. Summary
    console.log('\n📊 Summary:');
    console.log(`   - Rate limit errors: ${rateLimitScans?.length || 0}`);
    console.log(`   - "no_warnings" logs: ${noWarningsLogs?.length || 0}`);
    console.log(`   - Suspicious "no_warnings" (low confidence): ${suspiciousLogs?.length || 0}`);
    console.log(`   - Analysis failures: ${failedScans?.length || 0}`);
    
    if ((rateLimitScans && rateLimitScans.length > 0) || (suspiciousLogs && suspiciousLogs.length > 0)) {
        console.log('\n⚠️  POTENTIAL ISSUE: Rate limiting may have caused false "Comfort Read" results');
        console.log('   Books affected should show as "Unknown" (not analyzed) not "Comfort Read"');
    } else {
        console.log('\n✅ No obvious rate limit issues detected');
    }
}

checkRateLimitIssues().catch(console.error);

