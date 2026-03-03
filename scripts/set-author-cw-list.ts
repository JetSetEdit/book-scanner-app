#!/usr/bin/env npx tsx
/**
 * Set author_content_warnings_list for a book (list you provide; no scraping).
 *
 * Usage:
 *   npx tsx scripts/set-author-cw-list.ts <isbn> "Item one" "Item two" ...
 *
 * Example (Love on the Brain):
 *   npx tsx scripts/set-author-cw-list.ts 9781408725771 \
 *     "Parental death in a car accident (in the past)" \
 *     "Death of a friend in a rock climbing accident (in the past)" \
 *     "Seizure disorder in children" \
 *     "Sexism in the workplace" \
 *     "Mentions of workplace sexual harassment" \
 *     "Firearms and life-threatening situations (that do NOT result in death)" \
 *     "Explicit and graphic sexual content" \
 *     "Cursing and vulgar language"
 */

import * as dotenv from "dotenv"
import * as path from "path"
import * as fs from "fs"
import { createClient } from "@supabase/supabase-js"

const envPath = path.resolve(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) dotenv.config({ path: envPath })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const isbn = process.argv[2]?.replace(/[-\s]/g, "")
const items = process.argv.slice(3).map((s) => s.trim()).filter(Boolean)

if (!isbn || items.length === 0) {
  console.error("Usage: npx tsx scripts/set-author-cw-list.ts <isbn> \"Item 1\" \"Item 2\" ...")
  process.exit(1)
}

async function main() {
  const { data, error } = await supabase
    .from("books")
    .update({ author_content_warnings_list: items })
    .eq("isbn", isbn)
    .select("isbn, title, author_content_warnings_url, author_content_warnings_list")
    .single()

  if (error) {
    console.error("Error:", error.message)
    process.exit(1)
  }
  if (!data) {
    console.error("No book found for ISBN:", isbn)
    process.exit(1)
  }

  console.log("Updated:", (data as { title?: string }).title, "|", (data as { isbn: string }).isbn)
  console.log("List length:", ((data as { author_content_warnings_list?: string[] }).author_content_warnings_list?.length ?? 0))
  console.log("Book page: http://localhost:3000/book/" + isbn)
}

main().catch(console.error)
