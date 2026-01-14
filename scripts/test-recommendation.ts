import { scoreBooksForBlackJoyQuery } from '../lib/recommendations/black-joy-scorer';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testRecommendationFlow() {
  console.log('🧪 Testing Black Joy Recommendation Flow...');

  // 1. Fetch Annotated Books
  const { data: books, error } = await supabase
    .from('books')
    .select('isbn, title, annotations')
    .not('annotations', 'is', null);

  if (error) {
    console.error('❌ DB Error:', error);
    return;
  }

  console.log(`📚 Found ${books?.length} annotated books in DB.`);

  if (!books?.length) return;

  // 2. Map
  const library = books.map((b: any) => ({
      isbn: b.isbn,
      title: b.title,
      ...b.annotations
  }));

  // 3. Score
  const results = scoreBooksForBlackJoyQuery(library);

  console.log('🏆 Results:');
  if (results.length === 0) {
      console.log('   (No matches found - filter worked!)');
      
      // Let's print the disqualified scores to be sure
      library.forEach((book: any) => {
          // Manually calc score to see why it failed
          const { calculateBlackJoyScore } = require('../lib/recommendations/black-joy-scorer');
          const score = calculateBlackJoyScore(book);
          const trauma = book.traumaTopics ? book.traumaTopics.join(', ') : 'None';
          console.log(`   - ${book.title}: Score ${score} (Trauma: ${trauma})`);
      });
  } else {
      results.forEach(r => {
          const book = library.find((b: any) => b.isbn === r.isbn);
          console.log(`   - [${r.score}] ${book.title}: ${r.matchReason}`);
      });
  }
}

testRecommendationFlow();
