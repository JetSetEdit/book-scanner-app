#!/usr/bin/env npx tsx
/**
 * Test author_content_warnings_url and compare with AI scan: fetch book, author URL, and
 * content warnings from DB; optionally fetch author page and show their list.
 *
 * Usage:
 *   npx tsx scripts/test-author-cw-url.ts [isbn]
 *
 * Example:
 *   npx tsx scripts/test-author-cw-url.ts 9781408725771
 */

import * as dotenv from "dotenv"
import * as path from "path"
import * as fs from "fs"
import { createClient } from "@supabase/supabase-js"

const envPath = path.resolve(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or Supabase key in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const isbn = process.argv[2] ?? "9781408725771"

async function main() {
  const cleanIsbn = isbn.replace(/[-\s]/g, "")
  console.log(`\n📚 Book: ${cleanIsbn}\n`)
  console.log("─".repeat(60))

  const { data: book, error } = await supabase
    .from("books")
    .select("id, isbn, title, author, author_content_warnings_url, author_content_warnings_list")
    .eq("isbn", cleanIsbn)
    .maybeSingle()

  if (error) {
    console.error("❌ DB error:", error.message)
    process.exit(1)
  }

  if (!book) {
    console.log("❌ No book found for this ISBN.")
    process.exit(1)
  }

  console.log("\n📖", book.title ?? "(no title)", "by", book.author ?? "(no author)")
  console.log("")

  // --- Author's content warnings URL ---
  const url = (book as { author_content_warnings_url?: string | null }).author_content_warnings_url
  if (url && url.trim() !== "") {
    console.log("🔗 Author's CW page:", url)
    try {
      const res = await fetch(url, { method: "HEAD", redirect: "follow" })
      console.log("   Reachable:", res.ok ? "yes (HTTP " + res.status + ")" : "HTTP " + res.status)
    } catch (e) {
      console.log("   Reachable: no —", (e as Error).message)
    }
  } else {
    console.log("🔗 Author's CW page: not set")
  }

  // --- Author's stored list (when provided) ---
  const authorList = (book as { author_content_warnings_list?: string[] | null }).author_content_warnings_list
  const authorItems = Array.isArray(authorList) ? authorList : []
  if (authorItems.length > 0) {
    console.log("\n📋 Author's list (stored):")
    authorItems.forEach((item, i) => console.log(`   ${i + 1}. ${item}`))
  }

  // --- AI scan (Subtext) content warnings ---
  const { data: warnings, error: warnErr } = await supabase
    .from("content_warnings")
    .select("id, description, severity, category, category_id, source, is_author_verified")
    .eq("book_id", book.id)
    .order("severity", { ascending: false })

  if (warnErr) {
    console.error("❌ Error fetching warnings:", warnErr.message)
  } else if (!warnings || warnings.length === 0) {
    console.log("\n🤖 AI scan (Subtext): no content warnings stored for this book.")
  } else {
    const aiWarnings = warnings.filter((w: { source?: string }) => w.source === "ai_generated")
    const otherWarnings = warnings.filter((w: { source?: string }) => w.source !== "ai_generated")
    console.log("\n🤖 AI scan (Subtext) says:")
    for (const w of aiWarnings) {
      const sev = (w as { severity?: string }).severity ?? "—"
      const cat = (w as { category_id?: string; category?: string }).category_id ?? (w as { category?: string }).category ?? "—"
      console.log(`   · [${sev}] ${(w as { description?: string }).description}`)
      console.log(`     category: ${cat}`)
    }
    if (otherWarnings.length > 0) {
      console.log(`   (+ ${otherWarnings.length} non-AI warning(s), e.g. author-verified or user-submitted)`)
    }
  }

  // --- Comparison: author vs AI (when both exist) ---
  const aiWarnings = (warnings ?? []).filter((w: { source?: string }) => w.source === "ai_generated") as { description?: string; severity?: string; category_id?: string; category?: string }[]
  if (authorItems.length > 0 && aiWarnings.length > 0) {
    const normalize = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ")
    const authorNorm = authorItems.map((item) => ({ raw: item, n: normalize(item) }))
    const aiNorm = aiWarnings.map((w) => ({
      raw: w.description ?? "",
      n: normalize(w.description ?? ""),
      severity: w.severity,
      category: w.category_id ?? w.category,
    }))

    const overlap: { author: string; ai: string }[] = []
    const authorOnly: string[] = []
    const aiOnly: string[] = []

    for (const a of authorNorm) {
      const matched = aiNorm.find(
        (b) =>
          (a.n.length > 4 && b.n.includes(a.n.slice(0, 12))) ||
          /\b(death|grief|die|died)\b/.test(a.n) && (b.category === "death_or_grief" || /\bdeath|grief\b/.test(b.n)) ||
          /\b(sex|sexual|explicit|graphic)\b/.test(a.n) && (b.category === "sexual_content" || /\bsexual|sex\b/.test(b.n)) ||
          /\b(sexism|harassment|discrimination|workplace)\b/.test(a.n) && (b.category === "discrimination" || /\bsexism|harass|discrim\b/.test(b.n)) ||
          /\b(violence|firearm|weapon|gun|life-threatening)\b/.test(a.n) && (b.category === "violence" || /\bviolen|weapon|gun\b/.test(b.n)) ||
          /\b(seizure|medical|health|disorder)\b/.test(a.n) && (b.category === "mental_health" || /\bmental|health|disorder\b/.test(b.n)) ||
          /\b(cursing|vulgar|language)\b/.test(a.n) && (b.category === "language" || /\blanguage|curs|vulgar\b/.test(b.n)) ||
          a.n.split(" ").some((word) => word.length > 4 && b.n.includes(word))
      )
      if (matched) overlap.push({ author: a.raw, ai: matched.raw })
      else authorOnly.push(a.raw)
    }

    const matchedAi = new Set(overlap.map((o) => o.ai))
    for (const b of aiNorm) {
      if (!matchedAi.has(b.raw)) aiOnly.push(`${b.raw} [${b.severity}]`)
    }

    console.log("\n📊 Comparison (author vs AI)")
    console.log("─".repeat(60))
    if (overlap.length > 0) {
      console.log("\n✓ Overlap (author item ↔ AI warning):")
      overlap.forEach(({ author, ai }) => {
        console.log(`   · ${author}`)
        console.log(`     → ${ai}`)
      })
    }
    if (authorOnly.length > 0) {
      console.log("\n✗ Author has, we're missing:")
      authorOnly.forEach((item) => console.log(`   · ${item}`))
    }
    if (aiOnly.length > 0) {
      console.log("\n+ We have, author doesn't list:")
      aiOnly.forEach((item) => console.log(`   · ${item}`))
    }
    console.log("\nSummary:", overlap.length, "overlap,", authorOnly.length, "author-only,", aiOnly.length, "AI-only")
  }

  console.log("\n" + "─".repeat(60))
  console.log("📖 Book page: http://localhost:3000/book/" + book.isbn)
  console.log("")
}

main().catch(console.error)
