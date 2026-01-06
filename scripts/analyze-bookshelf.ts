/**
 * Analyze bookshelf and identify which books to keep vs delete
 * 
 * Criteria for keeping:
 * 1. Has age rating (CLASSIFICATION: in categories)
 * 2. Has content warnings
 * 3. Has cover image
 * 4. Scanned recently (within last 7 days)
 * 5. Popular/recognizable title
 */

import 'dotenv/config'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface BookAnalysis {
  id: string
  isbn: string
  title: string
  author: string | null
  cover_url: string | null
  hasAgeRating: boolean
  ageRating: string | null
  warningCount: number
  hasCover: boolean
  lastUpdated: string | null
  daysSinceUpdate: number | null
  categories: string[] | null
  score: number // 0-100, higher = better candidate to keep
  keep: boolean
  reason: string
}

async function analyzeBookshelf() {
  console.log('📚 Analyzing bookshelf...\n')

  // Fetch all books
  const { data: books, error: booksError } = await supabaseAdmin
    .from('books')
    .select('id, isbn, title, author, cover_url, categories, updated_at, created_at')
    .order('updated_at', { ascending: false })

  if (booksError) {
    console.error('Error fetching books:', booksError)
    return
  }

  if (!books || books.length === 0) {
    console.log('No books found in database.')
    return
  }

  console.log(`Found ${books.length} books\n`)

  // Fetch warning counts for all books
  // Note: content_warnings table uses 'book_id' which is the book's ISBN
  const { data: warnings, error: warningsError } = await supabaseAdmin
    .from('content_warnings')
    .select('book_id')

  if (warningsError) {
    console.error('Error fetching warnings:', warningsError)
    return
  }

  // Count warnings per book
  // book_id in content_warnings is the ISBN
  const warningCounts = new Map<string, number>()
  warnings?.forEach(w => {
    warningCounts.set(w.book_id, (warningCounts.get(w.book_id) || 0) + 1)
  })

  // Analyze each book
  const now = new Date()
  const analyses: BookAnalysis[] = books.map(book => {
    const categories = book.categories || []
    const ageRatingCategory = categories.find((c: string) => c.startsWith('CLASSIFICATION:'))
    const hasAgeRating = !!ageRatingCategory
    const ageRating = ageRatingCategory ? ageRatingCategory.replace('CLASSIFICATION:', '') : null
    // Check both by ID and ISBN (book_id in warnings is ISBN)
    const warningCount = warningCounts.get(book.isbn) || warningCounts.get(book.id) || 0
    const hasCover = !!book.cover_url
    const lastUpdated = book.updated_at || book.created_at
    const daysSinceUpdate = lastUpdated 
      ? Math.floor((now.getTime() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24))
      : null

    // Calculate score (0-100)
    let score = 0
    if (hasAgeRating) score += 30
    if (warningCount > 0) score += 30
    if (hasCover) score += 20
    if (daysSinceUpdate !== null && daysSinceUpdate <= 7) score += 20

    // Determine if we should keep it
    const keep = score >= 50 && hasAgeRating && warningCount > 0 && hasCover

    let reason = ''
    if (!keep) {
      const reasons: string[] = []
      if (!hasAgeRating) reasons.push('no age rating')
      if (warningCount === 0) reasons.push('no warnings')
      if (!hasCover) reasons.push('no cover')
      if (daysSinceUpdate !== null && daysSinceUpdate > 30) reasons.push('old scan')
      reason = reasons.join(', ')
    } else {
      reason = 'meets all criteria'
    }

    return {
      id: book.id,
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      cover_url: book.cover_url,
      hasAgeRating,
      ageRating,
      warningCount,
      hasCover,
      lastUpdated,
      daysSinceUpdate,
      categories,
      score,
      keep,
      reason
    }
  })

  // Sort by score (highest first)
  analyses.sort((a, b) => b.score - a.score)

  // Print summary
  const keepCount = analyses.filter(a => a.keep).length
  const deleteCount = analyses.length - keepCount

  console.log('='.repeat(80))
  console.log('📊 BOOKSHELF ANALYSIS SUMMARY')
  console.log('='.repeat(80))
  console.log(`Total books: ${analyses.length}`)
  console.log(`✅ Keep: ${keepCount}`)
  console.log(`❌ Delete: ${deleteCount}`)
  console.log('='.repeat(80))
  console.log()

  // Print books to KEEP (top 20)
  console.log('✅ BOOKS TO KEEP (Top 20):')
  console.log('-'.repeat(80))
  const keepBooks = analyses.filter(a => a.keep).slice(0, 20)
  keepBooks.forEach((book, idx) => {
    console.log(`${idx + 1}. ${book.title} by ${book.author || 'Unknown'}`)
    console.log(`   ISBN: ${book.isbn} | Rating: ${book.ageRating || 'N/A'} | Warnings: ${book.warningCount} | Score: ${book.score}/100`)
    console.log(`   Updated: ${book.daysSinceUpdate !== null ? `${book.daysSinceUpdate} days ago` : 'unknown'}`)
    console.log()
  })

  // Print books to DELETE (worst offenders)
  console.log('❌ BOOKS TO DELETE (Worst Offenders - Top 20):')
  console.log('-'.repeat(80))
  const deleteBooks = analyses.filter(a => !a.keep).slice(0, 20)
  deleteBooks.forEach((book, idx) => {
    console.log(`${idx + 1}. ${book.title} by ${book.author || 'Unknown'}`)
    console.log(`   ISBN: ${book.isbn} | Score: ${book.score}/100`)
    console.log(`   Reason: ${book.reason}`)
    console.log()
  })

  // Print statistics
  console.log('📈 STATISTICS:')
  console.log('-'.repeat(80))
  const withAgeRating = analyses.filter(a => a.hasAgeRating).length
  const withWarnings = analyses.filter(a => a.warningCount > 0).length
  const withCover = analyses.filter(a => a.hasCover).length
  const recentScans = analyses.filter(a => a.daysSinceUpdate !== null && a.daysSinceUpdate <= 7).length

  console.log(`Books with age rating: ${withAgeRating} (${Math.round(withAgeRating / analyses.length * 100)}%)`)
  console.log(`Books with warnings: ${withWarnings} (${Math.round(withWarnings / analyses.length * 100)}%)`)
  console.log(`Books with cover: ${withCover} (${Math.round(withCover / analyses.length * 100)}%)`)
  console.log(`Recent scans (≤7 days): ${recentScans} (${Math.round(recentScans / analyses.length * 100)}%)`)
  console.log()

  // Export to JSON for review
  const exportData = {
    summary: {
      total: analyses.length,
      keep: keepCount,
      delete: deleteCount,
      timestamp: new Date().toISOString()
    },
    books: analyses.map(a => ({
      isbn: a.isbn,
      title: a.title,
      author: a.author,
      keep: a.keep,
      score: a.score,
      reason: a.reason,
      hasAgeRating: a.hasAgeRating,
      ageRating: a.ageRating,
      warningCount: a.warningCount,
      hasCover: a.hasCover,
      daysSinceUpdate: a.daysSinceUpdate
    }))
  }

  const fs = await import('fs/promises')
  await fs.writeFile(
    'bookshelf-analysis.json',
    JSON.stringify(exportData, null, 2)
  )

  console.log('💾 Analysis exported to: bookshelf-analysis.json')
  console.log()
  console.log('💡 Next steps:')
  console.log('   1. Review bookshelf-analysis.json')
  console.log('   2. Run: npm run scripts/delete-books.ts (when ready)')
  console.log('   3. Or manually delete books via Supabase dashboard')
}

analyzeBookshelf().catch(console.error)

