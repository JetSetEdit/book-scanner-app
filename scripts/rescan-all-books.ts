/**
 * Re-scan all books in the database with the latest logic
 * 
 * This script fetches all books from the database and re-scans them
 * with forceRefresh=true to regenerate warnings using the most recent
 * analysis logic.
 * 
 * Usage: npx tsx scripts/rescan-all-books.ts [--limit N] [--delay MS]
 */

import dotenv from 'dotenv';

// Load environment variables first, before any imports
dotenv.config({ path: '.env.local' });
dotenv.config(); // Also load .env if it exists

interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string | null;
}

interface ScanStats {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
}

async function main() {
  // Parse command line arguments
  const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
  const delayArg = process.argv.find(arg => arg.startsWith('--delay='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;
  const delayMs = delayArg ? parseInt(delayArg.split('=')[1], 10) : 3000; // Default 3 seconds

  // Now import after env vars are loaded
  const { processIsbnScan } = await import('../lib/services/scan-service');
  const { createClient } = await import('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('   Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔄 Re-scanning all books with latest logic...\n');
  console.log('─'.repeat(70));

  // Fetch all books from database
  console.log('\n📚 Fetching all books from database...');
  let query = supabase
    .from('books')
    .select('id, isbn, title, author')
    .order('created_at', { ascending: true });

  if (limit) {
    query = query.limit(limit);
    console.log(`   Limiting to ${limit} books`);
  }

  const { data: books, error: fetchError } = await query;

  if (fetchError) {
    console.error('❌ Error fetching books:', fetchError);
    process.exit(1);
  }

  if (!books || books.length === 0) {
    console.log('⚠️  No books found in database');
    process.exit(0);
  }

  console.log(`✅ Found ${books.length} book(s) to re-scan\n`);

  const stats: ScanStats = {
    total: books.length,
    successful: 0,
    failed: 0,
    skipped: 0
  };

  // Re-scan each book
  console.log('─'.repeat(70));
  console.log('\n🔍 Starting re-scan process...\n');

  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    const progress = `[${i + 1}/${books.length}]`;

    console.log(`${progress} 📖 ${book.title}`);
    if (book.author) {
      console.log(`    Author: ${book.author}`);
    }
    console.log(`    ISBN: ${book.isbn}`);

    try {
      const onProgress = (message: string | any) => {
        if (typeof message === 'string') {
          process.stdout.write(`\r    ${message.substring(0, 80).padEnd(80)}`);
        } else if (message && typeof message === 'object' && message.action) {
          process.stdout.write(`\r    ${message.action.substring(0, 80).padEnd(80)}`);
        }
      };

      const result = await processIsbnScan(
        book.isbn,
        onProgress,
        undefined, // selectedCandidate
        true, // forceRefresh - force re-analysis with latest logic
        'gpt-4o'
      );

      // Clear progress line
      process.stdout.write('\r' + ' '.repeat(80) + '\r');

      if (result.success) {
        console.log(`    ✅ Scan completed successfully`);
        stats.successful++;
      } else {
        console.log(`    ⚠️  Scan completed with status: ${result.status || 'unknown'}`);
        if (result.message) {
          console.log(`       ${result.message}`);
        }
        stats.skipped++;
      }

      // Wait between scans to avoid rate limits
      if (i < books.length - 1) {
        console.log(`    ⏳ Waiting ${delayMs}ms before next scan...\n`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

    } catch (error) {
      // Clear progress line
      process.stdout.write('\r' + ' '.repeat(80) + '\r');
      
      console.error(`    ❌ Failed to scan: ${error instanceof Error ? error.message : String(error)}`);
      stats.failed++;
      
      // Wait even on error to avoid hammering the API
      if (i < books.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  // Print summary
  console.log('\n' + '─'.repeat(70));
  console.log('\n📊 Re-scan Summary:\n');
  console.log(`   Total books: ${stats.total}`);
  console.log(`   ✅ Successful: ${stats.successful}`);
  console.log(`   ⚠️  Skipped: ${stats.skipped}`);
  console.log(`   ❌ Failed: ${stats.failed}`);
  console.log('\n✅ Re-scanning complete!\n');
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

