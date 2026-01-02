/**
 * List recent books to see what's actually in the database
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

async function listRecentBooks() {
    console.log('📚 Recent books in database:\n');

    const { data: books, error } = await supabase
        .from('books')
        .select(`
            id,
            isbn,
            title,
            author,
            cover_url,
            description,
            created_at,
            content_warnings(id),
            ai_audit_logs!left(id, decision_type, created_at, confidence_level)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!books || books.length === 0) {
        console.log('No books found.');
        return;
    }

    for (const book of books) {
        const auditLogs = (book.ai_audit_logs as any[]) || [];
        const warnings = (book.content_warnings as any[]) || [];
        const hasAnalysis = auditLogs.length > 0;
        const isAnalyzed = hasAnalysis && auditLogs.some(log => 
            log.decision_type === 'warnings_generated' || log.decision_type === 'no_warnings'
        );

        console.log(`\n📖 "${book.title}" by ${book.author || 'Unknown'}`);
        console.log(`   ISBN: ${book.isbn}`);
        console.log(`   Created: ${new Date(book.created_at).toLocaleString()}`);
        console.log(`   Cover: ${book.cover_url ? '✅' : '❌'} ${book.cover_url ? book.cover_url.substring(0, 60) + '...' : 'No cover'}`);
        console.log(`   Description: ${book.description?.length || 0} chars`);
        console.log(`   Warnings: ${warnings.length}`);
        console.log(`   Analysis: ${isAnalyzed ? '✅ Analyzed' : '❌ Not analyzed'}`);
        if (hasAnalysis) {
            auditLogs.forEach(log => {
                console.log(`     - ${log.decision_type} (${log.confidence_level || 'N/A'}) at ${new Date(log.created_at).toLocaleString()}`);
            });
        } else {
            console.log(`     ⚠️  Should show as "Unknown" in collection page`);
        }
    }
}

listRecentBooks().catch(console.error);

