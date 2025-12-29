#!/usr/bin/env tsx

/**
 * Script to check description lengths for all books in the database
 * Helps identify books with overly long synopses that might need truncation
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

interface BookDescriptionStats {
  isbn: string
  title: string
  author: string | null
  description_length: number
  description_preview: string
  length_category: string
}

async function checkDescriptionLengths() {

  console.log("📊 Checking description lengths for all books...\n")

  // Get all books with their descriptions
  const { data: books, error } = await supabase
    .from("books")
    .select("isbn, title, author, description")
    .order("title")

  if (error) {
    console.error("❌ Error fetching books:", error)
    process.exit(1)
  }

  if (!books || books.length === 0) {
    console.log("No books found in database.")
    return
  }

  // Calculate stats for each book
  const stats: BookDescriptionStats[] = books.map((book) => {
    const description = book.description || ""
    const length = description.length

    let category: string
    if (length === 0) {
      category = "No description"
    } else if (length < 200) {
      category = "Short (< 200)"
    } else if (length < 500) {
      category = "Medium (200-500)"
    } else if (length < 1000) {
      category = "Long (500-1000)"
    } else if (length < 2000) {
      category = "Very Long (1000-2000)"
    } else {
      category = "Extremely Long (> 2000)"
    }

    return {
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      description_length: length,
      description_preview: description.substring(0, 100) + (description.length > 100 ? "..." : ""),
      length_category: category,
    }
  })

  // Sort by length (longest first)
  stats.sort((a, b) => b.description_length - a.description_length)

  // Summary statistics
  const totalBooks = stats.length
  const booksWithDescriptions = stats.filter((s) => s.description_length > 0).length
  const avgLength = stats.reduce((sum, s) => sum + s.description_length, 0) / totalBooks
  const medianLength = stats[Math.floor(totalBooks / 2)].description_length

  // Count by category
  const categoryCounts: Record<string, number> = {}
  stats.forEach((s) => {
    categoryCounts[s.length_category] = (categoryCounts[s.length_category] || 0) + 1
  })

  console.log("=" .repeat(80))
  console.log("📈 SUMMARY STATISTICS")
  console.log("=" .repeat(80))
  console.log(`Total books: ${totalBooks}`)
  console.log(`Books with descriptions: ${booksWithDescriptions}`)
  console.log(`Average description length: ${avgLength.toFixed(0)} characters`)
  console.log(`Median description length: ${medianLength} characters`)
  console.log("\n📊 Distribution by length category:")
  Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      const percentage = ((count / totalBooks) * 100).toFixed(1)
      console.log(`  ${category.padEnd(30)} ${count.toString().padStart(4)} (${percentage}%)`)
    })

  console.log("\n" + "=" .repeat(80))
  console.log("📋 TOP 20 LONGEST DESCRIPTIONS")
  console.log("=" .repeat(80))
  console.log(
    "ISBN".padEnd(15) +
      "Length".padEnd(10) +
      "Category".padEnd(25) +
      "Title".padEnd(40) +
      "Preview"
  )
  console.log("-".repeat(80))

  stats.slice(0, 20).forEach((stat) => {
    const title = (stat.title || "Unknown").substring(0, 38)
    const preview = stat.description_preview.substring(0, 50)
    console.log(
      `${stat.isbn.padEnd(15)}${stat.description_length.toString().padEnd(10)}${stat.length_category.padEnd(25)}${title.padEnd(40)}${preview}`
    )
  })

  console.log("\n" + "=" .repeat(80))
  console.log("📋 BOOKS WITH EXTREMELY LONG DESCRIPTIONS (> 2000 chars)")
  console.log("=" .repeat(80))

  const extremelyLong = stats.filter((s) => s.description_length > 2000)
  if (extremelyLong.length === 0) {
    console.log("✅ No books with extremely long descriptions found!")
  } else {
    extremelyLong.forEach((stat) => {
      console.log(`\n📖 ${stat.title} (${stat.isbn})`)
      console.log(`   Author: ${stat.author || "Unknown"}`)
      console.log(`   Length: ${stat.description_length} characters`)
      console.log(`   URL: https://subtext-books.vercel.app/book/${stat.isbn}`)
      console.log(`   Preview: ${stat.description_preview}`)
    })
  }

  console.log("\n" + "=" .repeat(80))
  console.log("📋 BOOKS WITH VERY LONG DESCRIPTIONS (1000-2000 chars)")
  console.log("=" .repeat(80))

  const veryLong = stats.filter(
    (s) => s.description_length >= 1000 && s.description_length <= 2000
  )
  if (veryLong.length === 0) {
    console.log("✅ No books with very long descriptions found!")
  } else {
    veryLong.forEach((stat) => {
      console.log(`\n📖 ${stat.title} (${stat.isbn})`)
      console.log(`   Author: ${stat.author || "Unknown"}`)
      console.log(`   Length: ${stat.description_length} characters`)
      console.log(`   URL: https://subtext-books.vercel.app/book/${stat.isbn}`)
    })
  }

  // Export to JSON for further analysis
  const output = {
    summary: {
      totalBooks,
      booksWithDescriptions,
      avgLength: Math.round(avgLength),
      medianLength,
      categoryCounts,
    },
    allBooks: stats.map((s) => ({
      isbn: s.isbn,
      title: s.title,
      author: s.author,
      description_length: s.description_length,
      length_category: s.length_category,
      url: `https://subtext-books.vercel.app/book/${s.isbn}`,
    })),
  }

  const fs = await import("fs/promises")
  await fs.writeFile(
    "description-lengths-analysis.json",
    JSON.stringify(output, null, 2)
  )
  console.log("\n✅ Detailed analysis saved to: description-lengths-analysis.json")
}

checkDescriptionLengths().catch((error) => {
  console.error("❌ Error:", error)
  process.exit(1)
})

