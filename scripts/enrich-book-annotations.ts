import { createClient } from '@supabase/supabase-js';
import { extractBookAnnotations } from '../lib/analysis/annotation-extractor';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function enrichBook(isbnOrId: string) {
  console.log(`🔍 Finding book: ${isbnOrId}...`);

  // Try to find by ISBN first, then ID
  let { data: book, error } = await supabase
    .from('books')
    .select('id, title, author, description, isbn')
    .eq('isbn', isbnOrId)
    .single();

  if (!book && !error) {
     const { data: bookById, error: errorId } = await supabase
      .from('books')
      .select('id, title, author, description, isbn')
      .eq('id', isbnOrId)
      .single();
      
     book = bookById;
     error = errorId;
  }

  if (error || !book) {
    console.error('❌ Book not found:', error?.message);
    return;
  }

  console.log(`📘 Found: "${book.title}" by ${book.author}`);
  console.log('🧠 Extracting annotations (characters, themes, tone)...');

  const annotations = await extractBookAnnotations({
    title: book.title,
    author: book.author || 'Unknown',
    description: book.description || '',
    isbn: book.isbn
  });

  console.log('✨ Annotations extracted:', JSON.stringify(annotations, null, 2));

  // Save to DB
  const { error: updateError } = await supabase
    .from('books')
    .update({ annotations: annotations })
    .eq('id', book.id);

  if (updateError) {
    console.error('❌ Failed to save annotations:', updateError.message);
  } else {
    console.log('✅ Successfully saved annotations to database!');
  }
}

// Get arg
const target = process.argv[2];
if (!target) {
  console.log('Usage: npx tsx scripts/enrich-book-annotations.ts <isbn_or_id>');
} else {
  enrichBook(target);
}
