import { NextResponse } from 'next/server';
import { scoreBooksForBlackJoyQuery } from '@/lib/recommendations/black-joy-scorer';
import { BookAnnotation } from '@/types/book-annotations';

// Example data source
const EXAMPLE_LIBRARY: BookAnnotation[] = [
  {
    isbn: "9780062896339", // Honey & Spice (Fabricated ISBN for example)
    title: "Honey & Spice",
    mainCharacters: [{ name: "Kiki", role: "protagonist", identities: ["Black", "British"] }],
    themes: ["romance", "campus life", "radio", "friendship"],
    traumaTopics: [],
    tone: ["romantic", "humorous", "low-conflict"],
    identityStruggleScore: 1
  },
  {
    isbn: "9780062498533", // The Hate U Give
    title: "The Hate U Give",
    mainCharacters: [{ name: "Starr", role: "protagonist", identities: ["Black", "African American"] }],
    themes: ["activism", "family", "courage"],
    traumaTopics: ["police_violence", "racism", "grief"],
    tone: ["high-stakes", "uplifting"],
    identityStruggleScore: 10
  },
  {
    isbn: "9781534441606", // Legendborn
    title: "Legendborn",
    mainCharacters: [{ name: "Bree", role: "protagonist", identities: ["Black", "African American"] }],
    themes: ["magic", "secret society", "ancestry"],
    traumaTopics: ["grief"],
    tone: ["high-stakes", "dark"],
    identityStruggleScore: 4
  },
  {
    isbn: "9780593438173", // The Neighbor Favor (Mixed)
    title: "The Neighbor Favor",
    mainCharacters: [{ name: "Lily", role: "protagonist", identities: ["White"] }, { name: "Nick", role: "protagonist", identities: ["Black"] }],
    themes: ["romance", "books", "correspondence"],
    traumaTopics: [],
    tone: ["cozy", "romantic"],
    identityStruggleScore: 0
  }
];

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const results = scoreBooksForBlackJoyQuery(EXAMPLE_LIBRARY);

  return NextResponse.json({
    description: "Demonstration of Black Joy Scoring Algorithm",
    query: "Find books with Black protagonists and no race-based trauma",
    total_books_scanned: EXAMPLE_LIBRARY.length,
    matched_books: results.length,
    results: results.map(r => {
        const book = EXAMPLE_LIBRARY.find(b => b.isbn === r.isbn);
        return {
            ...r,
            title: book?.title,
            trauma_topics: book?.traumaTopics,
            tone: book?.tone
        };
    })
  });
}
