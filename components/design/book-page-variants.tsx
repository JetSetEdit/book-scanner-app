"use client"

import { useState } from "react"
import { ContentWarningsList } from "@/components/content-warnings-list"
import { BooktokWarningsSummary } from "@/components/booktok-warnings-summary"
import { ShareButton } from "@/components/ShareButton"
import { BuyButton } from "@/components/BuyButton"
import Link from "next/link"
import { BookOpen } from "lucide-react"

const DESCRIPTION_TRUNCATE = 400

function CoverBlock({
  book,
  className = "",
  maxWidth,
}: {
  book: { cover_url?: string | null; title: string }
  className?: string
  maxWidth?: string
}) {
  return (
    <div
      className={`relative aspect-[2/3] w-full bg-muted shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] ${maxWidth || "max-w-full"} ${className}`}
    >
      {book.cover_url ? (
        <img
          src={
            book.cover_url.startsWith("http")
              ? `/api/book-cover?url=${encodeURIComponent(book.cover_url)}`
              : book.cover_url
          }
          alt={`Cover of ${book.title}`}
          className="object-cover w-full h-full"
          onError={(e) => {
            const t = e.target as HTMLImageElement
            t.style.display = "none"
            const p = t.parentElement
            if (p && !p.querySelector(".cover-placeholder")) {
              const d = document.createElement("div")
              d.className =
                "cover-placeholder w-full h-full flex items-center justify-center bg-muted text-muted-foreground font-serif italic text-sm"
              d.textContent = "Image not available"
              p.appendChild(d)
            }
          }}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <BookOpen className="h-10 w-10" />
          <span className="font-serif italic text-sm">Cover unavailable</span>
        </div>
      )}
    </div>
  )
}

export function BookPageCompact({
  book,
  warnings,
}: {
  book: any
  warnings: any[]
}) {
  const desc = book.description || ""
  const isLong = desc.length > DESCRIPTION_TRUNCATE
  const [expanded, setExpanded] = useState(false)
  const show = expanded ? desc : desc.slice(0, DESCRIPTION_TRUNCATE)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex justify-center">
        <CoverBlock book={book} maxWidth="max-w-[220px]" />
      </div>
      <div className="space-y-4">
        <h1 className="text-3xl font-serif font-medium tracking-tight text-foreground">
          {book.title}
        </h1>
        <p className="text-lg font-serif italic text-muted-foreground">
          by {book.author || "Unknown Author"}
        </p>
        <div className="flex gap-2">
          <BuyButton isbn={book.isbn} />
          <ShareButton title={book.title} author={book.author || "Unknown Author"} isbn={book.isbn} />
        </div>
      </div>
      {desc && (
        <div className="border-t border-border pt-4">
          <p className="text-muted-foreground text-sm leading-relaxed font-serif">
            {show}
            {isLong && !expanded && "… "}
            {isLong && (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="text-primary hover:underline text-sm"
              >
                {expanded ? "Show less" : "Read more"}
              </button>
            )}
          </p>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="border-t border-border pt-4">
          <BooktokWarningsSummary warnings={warnings} />
        </div>
      )}
      <div className="border-t border-border pt-4">
        <ContentWarningsList
          warnings={warnings}
          analysisStatus="complete"
          isbn={book.isbn}
        />
      </div>
    </div>
  )
}

export function BookPageSpacious({
  book,
  warnings,
}: {
  book: any
  warnings: any[]
}) {
  return (
    <div className="grid lg:grid-cols-[440px_1fr] gap-12 lg:gap-20 items-start">
      <div className="space-y-10 lg:sticky lg:top-8">
        <CoverBlock book={book} />
        <div className="border-t-2 border-border pt-8">
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4 text-muted-foreground">
            Specifications
          </h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">ISBN</span>
              <span className="font-mono">{book.isbn}</span>
            </div>
            {book.publisher && (
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Publisher</span>
                <span>{book.publisher}</span>
              </div>
            )}
            {book.published_date && (
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Released</span>
                <span>{book.published_date}</span>
              </div>
            )}
            {book.page_count && (
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Length</span>
                <span>{book.page_count} pages</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-14">
        <div className="space-y-6">
          <h1 className="text-5xl md:text-6xl font-serif font-medium tracking-tight text-foreground leading-[1.1]">
            {book.title}
          </h1>
          <p className="text-xl md:text-2xl font-serif italic text-muted-foreground border-l-2 border-border pl-6 py-1">
            by {book.author ? <Link href={`/bookshelf?author=${encodeURIComponent(book.author)}`} className="hover:text-foreground">{book.author}</Link> : "Unknown Author"}
          </p>
          <div className="flex gap-2">
            <BuyButton isbn={book.isbn} />
            <ShareButton title={book.title} author={book.author || "Unknown Author"} isbn={book.isbn} />
          </div>
        </div>
        {book.description && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-4 text-muted-foreground">
              About
            </h3>
            <p className="text-muted-foreground leading-relaxed font-serif">
              {book.description}
            </p>
          </div>
        )}
        {warnings.length > 0 && (
          <div>
            <BooktokWarningsSummary warnings={warnings} />
          </div>
        )}
        <div>
          <ContentWarningsList
            warnings={warnings}
            analysisStatus="complete"
            isbn={book.isbn}
          />
        </div>
      </div>
    </div>
  )
}
