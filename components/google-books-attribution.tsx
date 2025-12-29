/**
 * Google Books Attribution Component
 * 
 * Displays proper attribution for Google Books API data as required by TOS.
 * This component should be included on any page that displays book metadata
 * sourced from Google Books API.
 */

interface GoogleBooksAttributionProps {
  isbn: string
  className?: string
}

export function GoogleBooksAttribution({ isbn, className = '' }: GoogleBooksAttributionProps) {
  const googleBooksUrl = `https://books.google.com/books?vid=ISBN${isbn}`

  return (
    <div className={`text-xs text-muted-foreground mt-4 pt-4 border-t ${className}`}>
      <p>
        Data sourced via{' '}
        <a
          href={googleBooksUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Google Books
        </a>
      </p>
    </div>
  )
}













