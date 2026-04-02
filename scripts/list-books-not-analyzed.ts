/**
 * List books that show "Content not yet analysed" in the UI:
 * no audit log (warnings_generated/no_warnings) and no content warnings
 * (after appeal suppression). This script uses raw DB state: no audit log +
 * no content_warnings rows. Books that have warnings but all under open
 * appeal also show as not analyzed but are not included here.
 *
 * Usage: npx tsx scripts/list-books-not-analyzed.ts [--limit=N] [--csv]
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

const DECISION_TYPES = ['warnings_generated', 'no_warnings'] as const;

async function main() {
  const limitMatch = process.argv.find((a) => a.startsWith('--limit='));
  const limit = limitMatch ? parseInt(limitMatch.split('=')[1], 10) : 500;
  const csv = process.argv.includes('--csv');

  // All books
  const { data: books, error: booksError } = await supabase
    .from('books')
    .select('id, title, author, isbn, created_at')
    .order('created_at', { ascending: false })
    .limit(limit * 2); // fetch extra so we can limit after filter

  if (booksError) {
    console.error('Error fetching books:', booksError);
    process.exit(1);
  }

  if (!books || books.length === 0) {
    console.log('No books found.');
    return;
  }

  const bookIds = books.map((b) => b.id);

  // Book IDs that have at least one relevant audit log
  const { data: auditLogs } = await supabase
    .from('ai_audit_logs')
    .select('book_id')
    .in('book_id', bookIds)
    .in('decision_type', DECISION_TYPES);

  const hasAuditLog = new Set((auditLogs || []).map((r) => r.book_id));

  // Book IDs that have at least one content warning
  const { data: warnings } = await supabase
    .from('content_warnings')
    .select('book_id')
    .in('book_id', bookIds);

  const hasWarnings = new Set((warnings || []).map((r) => r.book_id));

  const notAnalyzed = books.filter(
    (b) => !hasAuditLog.has(b.id) && !hasWarnings.has(b.id)
  );

  const result = notAnalyzed.slice(0, limit);

  if (csv) {
    console.log('isbn,title,author,created_at');
    for (const b of result) {
      const title = (b.title || '').replace(/"/g, '""');
      const author = (b.author || '').replace(/"/g, '""');
      console.log(`${b.isbn},"${title}","${author}",${b.created_at}`);
    }
    return;
  }

  console.log(
    `Books with no audit log and no content warnings (show "Content not yet analysed"): ${result.length}\n`
  );
  if (result.length === 0) {
    console.log('None in the checked set.');
    return;
  }
  for (const b of result) {
    console.log(`  ${b.isbn}  ${b.title || '(no title)'} — ${b.author || 'Unknown'}`);
  }
  console.log(`\nTotal checked: ${books.length}. Not analyzed: ${notAnalyzed.length}.`);
}

main().catch(console.error);
