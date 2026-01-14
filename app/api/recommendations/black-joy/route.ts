import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { scoreBooksForBlackJoyQuery } from '@/lib/recommendations/black-joy-scorer';
import { BookAnnotation } from '@/types/book-annotations';

// Init Supabase (use service role for generic read access if needed, or anon)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch books that have annotations
    const { data: books, error } = await supabase
      .from('books')
      .select('isbn, title, annotations')
      .not('annotations', 'is', null)
      .limit(100); // Limit for performance in this demo

    if (error) throw error;

    if (!books || books.length === 0) {
        return NextResponse.json({
            message: "No annotated books found. Run 'npx tsx scripts/enrich-book-annotations.ts <isbn>' to populate data.",
            results: []
        });
    }

    // 2. Map DB rows to BookAnnotation objects
    // We assume the DB 'annotations' column matches the shape of Omit<BookAnnotation, 'isbn' | 'title'>
    const annotatedBooks: BookAnnotation[] = books.map((b: any) => ({
      isbn: b.isbn,
      title: b.title,
      ...b.annotations
    })).filter(b => b.mainCharacters && Array.isArray(b.mainCharacters)); // Simple validation

    // 3. Run the Scorer
    const results = scoreBooksForBlackJoyQuery(annotatedBooks);

    // 4. Return enriched results
    const enrichedResults = results.map(r => {
        const book = annotatedBooks.find(b => b.isbn === r.isbn);
        return {
            rank: r.score, // score
            title: book?.title,
            isbn: r.isbn,
            match_reason: r.matchReason,
            // Debug info
            main_characters: book?.mainCharacters,
            tone: book?.tone
        };
    });

    return NextResponse.json({
      count: enrichedResults.length,
      query: "Black Joy (No race-based trauma, positive tones favored)",
      results: enrichedResults
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
