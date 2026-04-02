import { processIsbnScan } from '../lib/services/scan-service';
import { createClient } from '@supabase/supabase-js';

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const { data: books } = await supabase
    .from('books')
    .select('isbn')
    .ilike('title', 'Little fires everywhere')
    .limit(1);

  if (!books || books.length === 0) {
    console.log("Book not found");
    return;
  }

  const isbn = books[0].isbn;
  console.log(`Scanning ISBN: ${isbn}`);

  const result = await processIsbnScan(isbn, (msg) => console.log(`[Progress] ${msg}`), undefined, false, undefined, undefined, 'deep');

  console.log("=== FINAL RESULT ===");
  console.log(`Success: ${result.success}`);
  console.log(`Status: ${result.status}`);
  console.log(`Generated: ${result.contentWarningsGenerated}`);
  console.log(`Message: ${result.message}`);

  const { data: warnings } = await supabase
    .from('content_warnings')
    .select('*')
    .eq('book_id', result.book?.id);

  console.log(`Stored Warnings Count: ${warnings?.length || 0}`);
}

run().catch(console.error);
