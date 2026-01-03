/**
 * Re-scan books to get proper AI reasoning for no warnings
 */

import dotenv from 'dotenv';

// Load environment variables first, before any imports
dotenv.config({ path: '.env.local' });
dotenv.config(); // Also load .env if it exists

async function main() {
  // Now import after env vars are loaded
  const { processIsbnScan } = await import('../lib/services/scan-service');
  const { createClient } = await import('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

// Books to re-scan
const booksToRescan = [
    { isbn: '9780241599198', title: 'The Summer I Turned Pretty' },
    { isbn: '9781398728561', title: 'Picking Daisies on Sundays' },
    { isbn: '9780008762261', title: 'Grumpy Darling' },
    { isbn: '9780008794149', title: 'Wild Darling' },
];

async function rescanBooks(supabase: any, processIsbnScan: any) {
    console.log('🔄 Re-scanning books to get proper AI reasoning...\n');

    for (const book of booksToRescan) {
        console.log(`\n📚 Scanning: ${book.title} (${book.isbn})`);
        
        try {
            const onProgress = (message: string | any) => {
                if (typeof message === 'string') {
                    process.stdout.write(`\r    ${message.substring(0, 80).padEnd(80)}`);
                }
            };

            const result = await processIsbnScan(
                book.isbn,
                onProgress,
                undefined, // selectedCandidate
                true, // forceRefresh - force re-analysis
                'gpt-4o'
            );

            if (result.success) {
                console.log(`\n    ✅ Scan completed successfully`);
            } else {
                console.log(`\n    ⚠️  Scan completed with status: ${result.status}`);
            }
            
            // Wait a bit between scans to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 3000));
            
        } catch (error) {
            console.error(`\n    ❌ Failed to scan ${book.title}:`, error instanceof Error ? error.message : error);
        }
    }

    console.log('\n\n✅ Re-scanning complete!');
    console.log('\n📊 Checking updated audit logs...\n');

    // Check the updated audit logs
    for (const book of booksToRescan) {
        const { data: auditLog } = await supabase
            .from('ai_audit_logs')
            .select('ai_reasoning, created_at')
            .eq('isbn', book.isbn)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (auditLog) {
            console.log(`📖 ${book.title}:`);
            console.log(`   Reasoning: ${auditLog.ai_reasoning?.substring(0, 200)}${auditLog.ai_reasoning && auditLog.ai_reasoning.length > 200 ? '...' : ''}`);
            console.log(`   Updated: ${auditLog.created_at}\n`);
        } else {
            console.log(`📖 ${book.title}: No audit log found\n`);
        }
    }
}

  await rescanBooks(supabase, processIsbnScan);
}

main().catch(console.error);

