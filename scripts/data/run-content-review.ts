import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import {
  reviewBookWarnings,
  reviewAllBooks,
  applyFixes,
  type ReviewResult
} from '../lib/services/content-review-agent'

// Load .env.local
const mainRepoPath = '/Users/jordanschepton/Documents/GitHub/Antigravity/book-scanner-app/.env.local'
const envPaths = [mainRepoPath, path.join(process.cwd(), '.env.local'), '.env.local']
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
    break
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const args = process.argv.slice(2)
  const isbn = args.find(arg => arg.startsWith('--isbn='))?.split('=')[1]
  const dryRun = !args.includes('--apply')
  const limit = args.find(arg => arg.startsWith('--limit='))?.split('=')[1]

  console.log('🔍 Content Review Agent')
  console.log('='.repeat(80))
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'APPLY FIXES'}`)
  console.log('')

  let results: ReviewResult[]

  if (isbn) {
    // Review specific book
    console.log(`Reviewing book: ${isbn}`)
    const { data: book } = await supabase
      .from('books')
      .select('id')
      .eq('isbn', isbn)
      .single()

    if (!book) {
      console.error(`❌ Book with ISBN ${isbn} not found`)
      process.exit(1)
    }

    const result = await reviewBookWarnings(supabase, book.id)
    results = result ? [result] : []
  } else {
    // Review all books
    console.log(`Reviewing all books${limit ? ` (limit: ${limit})` : ''}...`)
    results = await reviewAllBooks(supabase, limit ? parseInt(limit) : undefined, false) // Show all books, not just those with issues
  }

  // Summary
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0)
  const duplicateIssues = results.reduce((sum, r) => 
    sum + r.issues.filter(i => i.type === 'duplicate').length, 0
  )
  const misclassificationIssues = results.reduce((sum, r) => 
    sum + r.issues.filter(i => i.type === 'misclassification').length, 0
  )
  const overClassificationIssues = results.reduce((sum, r) => 
    sum + r.issues.filter(i => i.type === 'over_classification').length, 0
  )

  console.log('\n📊 SUMMARY')
  console.log('='.repeat(80))
  console.log(`Books reviewed: ${results.length}`)
  console.log(`Total issues found: ${totalIssues}`)
  console.log(`  - Duplicates: ${duplicateIssues}`)
  console.log(`  - Misclassifications: ${misclassificationIssues}`)
  console.log(`  - Over-classifications: ${overClassificationIssues}`)

  // Show books with issues
  if (results.length > 0) {
    console.log('\n📚 BOOKS WITH ISSUES:')
    console.log('='.repeat(80))
    
    results.forEach(result => {
      console.log(`\n${result.book_title} (${result.book_isbn})`)
      console.log(`  Current Score: ${result.score_before.toFixed(1)}`)
      console.log(`  Issues: ${result.issues.length}`)
      
      result.issues.forEach((issue, i) => {
        console.log(`\n  ${i + 1}. [${issue.type.toUpperCase()}] ${issue.severity.toUpperCase()}`)
        console.log(`     ${issue.description}`)
        if (issue.recommendation) {
          console.log(`     💡 ${issue.recommendation}`)
        }
      })
    })
  }

  // Apply fixes if requested
  if (!dryRun && totalIssues > 0) {
    console.log('\n🔧 APPLYING FIXES...')
    console.log('='.repeat(80))
    
    let totalFixed = 0
    let totalErrors = 0

    for (const result of results) {
      const { fixed, errors } = await applyFixes(supabase, result, false)
      totalFixed += fixed
      totalErrors += errors
      
      if (fixed > 0) {
        console.log(`✅ ${result.book_title}: Fixed ${fixed} issue(s)`)
      }
      if (errors > 0) {
        console.log(`❌ ${result.book_title}: ${errors} error(s)`)
      }
    }

    console.log(`\n✅ Total fixed: ${totalFixed}`)
    if (totalErrors > 0) {
      console.log(`❌ Total errors: ${totalErrors}`)
    }
  } else if (totalIssues > 0) {
    console.log('\n💡 To apply fixes, run with --apply flag')
    console.log('   Example: npm run review -- --apply')
  }

  // Export results to JSON
  const outputFile = `content-review-${Date.now()}.json`
  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2))
  console.log(`\n📄 Results saved to: ${outputFile}`)
}

main().catch(console.error)

