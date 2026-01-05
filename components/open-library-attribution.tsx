/**
 * Open Library Attribution Component
 * 
 * Displays proper attribution for Open Library API data.
 * While not strictly required, it's good practice to attribute Open Library data.
 */

interface OpenLibraryAttributionProps {
  isbn: string
  className?: string
}

export function OpenLibraryAttribution({ isbn, className = '' }: OpenLibraryAttributionProps) {
  const openLibraryUrl = `https://openlibrary.org/isbn/${isbn}`

  return (
    <div className={`text-xs text-muted-foreground mt-4 pt-4 border-t ${className}`}>
      <p>
        Data sourced via{' '}
        <a
          href={openLibraryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Open Library
        </a>
      </p>
    </div>
  )
}

