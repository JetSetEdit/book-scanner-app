import Link from "next/link"

interface BookStubPageBasicProps {
  isbn: string
  metadata: { title?: string; author?: string } | null
}

export function BookStubPageBasic({ isbn, metadata }: BookStubPageBasicProps) {
  return (
    <main className="min-h-screen px-4 py-6 max-w-md mx-auto" style={{ background: "var(--term-bg)", color: "var(--term-fg)" }}>
      <p className="text-sm mb-4">
        <Link href="/" style={{ color: "var(--term-fg)" }}>Home</Link>
        {" · "}
        <Link href="/bookshelf" style={{ color: "var(--term-fg)" }}>Bookshelf</Link>
      </p>
      {metadata?.title && <h1 className="text-lg font-normal mb-1">{metadata.title}</h1>}
      {metadata?.author && <p className="text-sm mb-4" style={{ color: "var(--term-dim)" }}>{metadata.author}</p>}
      <p className="text-sm mb-4" style={{ color: "var(--term-dim)" }}>Not scanned. Scan to add content warnings.</p>
      <p className="text-sm">
        <Link href={`/scan?isbn=${encodeURIComponent(isbn)}`}>Scan this book</Link>
      </p>
    </main>
  )
}
