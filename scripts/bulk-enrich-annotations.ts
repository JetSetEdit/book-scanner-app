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

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function bulkEnrich() {
  console.log('📚 Starting bulk enrichment of book annotations...');

  // 1. Fetch all books that are missing annotations
  // Check for both null and empty object
  const { data: books, error } = await supabase
    .from('books')
    .select('id, title, author, description, isbn')
    .or('annotations.is.null,annotations.eq.{}');

  if (error) {
    console.error('❌ Failed to fetch books:', error.message);
    return;
  }

  if (!books || books.length === 0) {
    console.log('✅ No books need enrichment! All books have annotations.');
    return;
  }

  console.log(`📋 Found ${books.length} books requiring annotations.`);

  let successCount = 0;
  let failureCount = 0;
  const CONCURRENCY = 3; // Process 3 at a time to respect rate limits

  for (let i = 0; i < books.length; i += CONCURRENCY) {
    const batch = books.slice(i, i + CONCURRENCY);
    console.log(`\nProcessing batch ${Math.floor(i / CONCURRENCY) + 1}/${Math.ceil(books.length / CONCURRENCY)}...`);

    const promises = batch.map(async (book) => {
      try {
        console.log(`   > Extracting: "${book.title}" (${book.isbn})`);

        if (!book.description || book.description.length < 50) {
            console.log(`   ⚠️ Skipping "${book.title}" - description too short`);
            return;
        }

        const annotations = await extractBookAnnotations({
          title: book.title,
          author: book.author || 'Unknown',
          description: book.description,
          isbn: book.isbn
        });

        // Save to DB
        const { error: updateError } = await supabase
          .from('books')
          .update({ annotations: annotations })
          .eq('id', book.id);

        if (updateError) {
          console.error(`   ❌ Failed to save "${book.title}":`, updateError.message);
          failureCount++;
        } else {
          console.log(`   ✅ Saved annotations for "${book.title}"`);
          successCount++;
        }
      } catch (err: any) {
        console.error(`   ❌ Error processing "${book.title}":`, err.message);
        failureCount++;
      }
    });

    await Promise.all(promises);
    
    // Tiny cooldown between batches
    if (i + CONCURRENCY < books.length) {
        await sleep(1000); 
    }
  }

  console.log('\n🎉 Bulk enrichment complete!');
  console.log(`✅ Successfully updated: ${successCount}`);
  console.log(`❌ Failed/Skipped: ${failureCount}`);
}

bulkEnrich();
