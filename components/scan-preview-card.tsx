import { createClient } from '@/lib/supabase/server'

const FALLBACK_BOOK = {
  title: 'The Long Game',
  author: 'Rachel Reid',
  coverUrl: 'https://covers.openlibrary.org/b/id/13229174-L.jpg',
  warnings: [
    { label: 'Homophobia', severity: 'severe' },
    { label: 'Deception Or Secrets', severity: 'moderate' },
    { label: 'Explicit Sexual Content', severity: 'moderate' },
    { label: 'Anxiety', severity: 'moderate' },
  ],
  context: 'Strong themes of discrimination, implicitly related to homophobia and societal pressure impacting a hidden relationship and professional careers.',
}

async function getRandomBook() {
  try {
    const supabase = await createClient()

    // Get books that have covers and warnings
    const { data: books } = await supabase
      .from('books')
      .select('id, title, author, cover_url')
      .not('cover_url', 'is', null)
      .not('title', 'is', null)
      .limit(50)

    if (!books?.length) return null

    // Pick a random one
    const book = books[Math.floor(Math.random() * books.length)]

    // Get its top warnings
    const { data: warnings } = await supabase
      .from('content_warnings')
      .select('category, severity')
      .eq('book_id', book.id)
      .in('severity', ['severe', 'moderate'])
      .order('severity', { ascending: true }) // severe first
      .limit(4)

    if (!warnings?.length) return null

    return {
      title: book.title,
      author: book.author ?? '',
      coverUrl: book.cover_url!,
      warnings: warnings.map(w => ({
        label: w.category.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        severity: w.severity,
      })),
      context: null,
    }
  } catch {
    return null
  }
}

export async function ScanPreviewCard() {
  const book = await getRandomBook() ?? FALLBACK_BOOK

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-sm text-left overflow-hidden">
      <div className="px-4 pt-3 pb-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Subtext LIVE
        </p>
      </div>
      <div className="flex gap-4 px-4 pb-4">
        {/* Big cover */}
        <img
          src={`/api/book-cover?url=${encodeURIComponent(book.coverUrl)}`}
          alt={book.title}
          className="h-48 w-32 rounded-lg object-cover bg-muted flex-shrink-0 shadow-sm"
        />

        {/* All text content */}
        <div className="flex flex-col justify-between min-w-0 py-1">
          <div>
            <p className="font-semibold text-foreground leading-tight">{book.title}</p>
            <p className="text-sm text-muted-foreground mb-3">{book.author}</p>

            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Content warnings
            </p>
            <ul className="space-y-1 mb-3">
              {book.warnings.map((w) => (
                <li key={w.label} className="text-xs">
                  <span
                    className={
                      w.severity === 'severe'
                        ? 'text-pink-600 dark:text-pink-400 font-medium'
                        : 'text-amber-600 dark:text-amber-400'
                    }
                  >
                    {w.label}: <span className="lowercase">{w.severity}</span>
                  </span>
                </li>
              ))}
            </ul>

            {'context' in book && book.context && (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Context
                </p>
                <p className="text-xs text-muted-foreground leading-snug">
                  {book.context}
                </p>
              </>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground/60 mt-2">
            Real result — different book on each visit.
          </p>
        </div>
      </div>
    </div>
  )
}
