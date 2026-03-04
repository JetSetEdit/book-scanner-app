"use client"

import Link from "next/link"

interface BookDetailsBasicProps {
  book: { title: string; author: string | null; cover_url: string | null; isbn: string }
  warnings: { description: string; severity?: string }[]
}

export function BookDetailsBasic({ book, warnings }: BookDetailsBasicProps) {
  return (
    <main className="min-h-screen px-4 py-6 max-w-md mx-auto" style={{ background: "var(--term-bg)", color: "var(--term-fg)" }}>
      <p className="text-sm mb-2">
        <Link href="/" style={{ color: "var(--term-fg)" }}>Home</Link>
        {" · "}
        <Link href="/bookshelf" style={{ color: "var(--term-fg)" }}>Bookshelf</Link>
      </p>
      <h1 className="text-lg font-normal mb-1">{book.title}</h1>
      {book.author && <p className="text-sm mb-4" style={{ color: "var(--term-dim)" }}>{book.author}</p>}
      {book.cover_url && (
        <img
          src={book.cover_url.startsWith("http") ? `/api/book-cover?url=${encodeURIComponent(book.cover_url)}` : book.cover_url}
          alt=""
          className="mb-4 max-w-[120px]"
        />
      )}
      <p className="text-sm font-normal mb-2">Content warnings</p>
      {warnings.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--term-dim)" }}>None identified.</p>
      ) : (
        <ul className="text-sm list-none pl-0 space-y-1">
          {warnings.map((w, i) => (
            <li key={i}>{w.description}</li>
          ))}
        </ul>
      )}
    </main>
  )
}
