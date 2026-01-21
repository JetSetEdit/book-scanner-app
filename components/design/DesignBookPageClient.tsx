"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { BookDetails } from "@/components/book-details"
import { BookPageCompact, BookPageSpacious } from "./book-page-variants"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

type Variant = "baseline" | "compact" | "spacious"

const VALID_V: Variant[] = ["baseline", "compact", "spacious"]

function parseV(s: string | null): Variant {
  return VALID_V.includes(s as Variant) ? (s as Variant) : "baseline"
}

export function DesignBookPageClient({
  book,
  warnings,
}: {
  book: any
  warnings: any[]
}) {
  const searchParams = useSearchParams()
  const [variant, setVariant] = useState<Variant>(() =>
    parseV(searchParams?.get("v") ?? null)
  )

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                ← Home
              </Button>
            </Link>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80">
              Design
            </span>
          </div>
          <Tabs value={variant} onValueChange={(v) => setVariant(v as Variant)}>
            <TabsList className="grid w-full grid-cols-3 sm:w-auto">
              <TabsTrigger value="baseline">Baseline</TabsTrigger>
              <TabsTrigger value="compact">Compact</TabsTrigger>
              <TabsTrigger value="spacious">Spacious</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {variant === "baseline" && (
          <BookDetails
            book={book}
            warnings={warnings}
            analysisStatus="complete"
            metadataIssues={null}
            noWarningsReasoning={null}
          />
        )}
        {variant === "compact" && (
          <BookPageCompact book={book} warnings={warnings} />
        )}
        {variant === "spacious" && (
          <BookPageSpacious book={book} warnings={warnings} />
        )}
      </div>
    </main>
  )
}
