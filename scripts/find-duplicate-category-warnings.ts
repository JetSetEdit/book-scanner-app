#!/usr/bin/env tsx

/**
 * Script to find books that have multiple content warnings using the same taxonomy category
 * Helps identify potential duplicates or cases where warnings should be consolidated
 */

import fs from "fs"
import path from "path"
import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/supabase"

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8")
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.+)$/)
    if (match) {
      const key = match[1].trim()
      let value = match[2].trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      process.env[key] = value
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient<Database>(supabaseUrl, supabaseKey)

interface DuplicateCategoryWarning {
  book_id: string
  isbn: string
  title: string
  author: string | null
  category_id: string | null
  category: string | null
  warning_count: number
  warnings: Array<{
    id: string
    description: string
    severity: string
    category_id: string | null
    category: string | null
  }>
}

async function findDuplicateCategoryWarnings() {
  console.log("🔍 Finding books with duplicate category warnings...\n")

  // Get all content warnings with book information
  const { data: warnings, error: warningsError } = await supabase
    .from("content_warnings")
    .select(`
      id,
      book_id,
      description,
      severity,
      category_id,
      category,
      books!inner (
        id,
        isbn,
        title,
        author
      )
    `)
    .order("book_id", { ascending: true })

  if (warningsError) {
    console.error("❌ Error fetching warnings:", warningsError)
    process.exit(1)
  }

  if (!warnings || warnings.length === 0) {
    console.log("No content warnings found in database.")
    return
  }

  console.log(`📊 Found ${warnings.length} total content warnings\n`)

  // Group warnings by book_id and category
  const bookCategoryMap = new Map<string, Map<string, any[]>>()

  for (const warning of warnings) {
    const book = warning.books as any
    if (!book) continue

    const bookId = warning.book_id
    // Use category_id if available, otherwise fall back to category
    const categoryKey = warning.category_id || warning.category || "unknown"

    if (!bookCategoryMap.has(bookId)) {
      bookCategoryMap.set(bookId, new Map())
    }

    const categoryMap = bookCategoryMap.get(bookId)!
    if (!categoryMap.has(categoryKey)) {
      categoryMap.set(categoryKey, [])
    }

    categoryMap.get(categoryKey)!.push({
      id: warning.id,
      description: warning.description,
      severity: warning.severity,
      category_id: warning.category_id,
      category: warning.category,
    })
  }

  // Find books with duplicate categories
  const duplicates: DuplicateCategoryWarning[] = []

  for (const [bookId, categoryMap] of bookCategoryMap.entries()) {
    for (const [categoryKey, warningList] of categoryMap.entries()) {
      if (warningList.length > 1) {
        // Get book info from first warning
        const firstWarning = warnings.find((w) => w.book_id === bookId)
        if (!firstWarning) continue

        const book = firstWarning.books as any
        duplicates.push({
          book_id: bookId,
          isbn: book.isbn,
          title: book.title,
          author: book.author,
          category_id: warningList[0].category_id,
          category: warningList[0].category || categoryKey,
          warning_count: warningList.length,
          warnings: warningList,
        })
      }
    }
  }

  // Group duplicates by book (since a book might have multiple duplicate categories)
  const booksWithDuplicates = new Map<string, DuplicateCategoryWarning[]>()

  for (const duplicate of duplicates) {
    if (!booksWithDuplicates.has(duplicate.book_id)) {
      booksWithDuplicates.set(duplicate.book_id, [])
    }
    booksWithDuplicates.get(duplicate.book_id)!.push(duplicate)
  }

  // Display results
  if (booksWithDuplicates.size === 0) {
    console.log("✅ No books found with duplicate category warnings!\n")
    return
  }

  console.log(`⚠️  Found ${booksWithDuplicates.size} book(s) with duplicate category warnings:\n`)
  console.log("=" .repeat(80))

  for (const [bookId, duplicateCategories] of booksWithDuplicates.entries()) {
    const firstDuplicate = duplicateCategories[0]
    console.log(`\n📚 ${firstDuplicate.title}`)
    console.log(`   ISBN: ${firstDuplicate.isbn}`)
    console.log(`   Author: ${firstDuplicate.author || "Unknown"}`)
    console.log(`   Book ID: ${bookId}`)
    console.log(`   Duplicate Categories: ${duplicateCategories.length}`)
    console.log("")

    for (const dup of duplicateCategories) {
      const categoryLabel = dup.category_id || dup.category || "unknown"
      console.log(`   🔸 Category: ${categoryLabel} (${dup.warning_count} warnings)`)
      
      for (let i = 0; i < dup.warnings.length; i++) {
        const warning = dup.warnings[i]
        console.log(`      ${i + 1}. [${warning.severity.toUpperCase()}]`)
        console.log(`         Description: ${warning.description}`)
        console.log(`         Warning ID: ${warning.id}`)
        console.log(`         Category ID: ${warning.category_id || "null"}`)
        console.log(`         Category: ${warning.category || "null"}`)
        console.log("")
      }
    }
    console.log("-".repeat(80))
  }

  // Summary statistics
  console.log("\n📈 Summary:")
  console.log(`   Total books with duplicates: ${booksWithDuplicates.size}`)
  console.log(`   Total duplicate category instances: ${duplicates.length}`)
  
  const categoryBreakdown = new Map<string, number>()
  for (const dup of duplicates) {
    const cat = dup.category_id || dup.category || "unknown"
    categoryBreakdown.set(cat, (categoryBreakdown.get(cat) || 0) + 1)
  }
  
  console.log("\n   Categories with duplicates:")
  for (const [category, count] of Array.from(categoryBreakdown.entries()).sort((a, b) => b[1] - a[1])) {
    console.log(`      • ${category}: ${count} book(s)`)
  }
}

// Run the script
findDuplicateCategoryWarnings()
  .then(() => {
    console.log("\n✅ Analysis complete!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Error:", error)
    process.exit(1)
  })

