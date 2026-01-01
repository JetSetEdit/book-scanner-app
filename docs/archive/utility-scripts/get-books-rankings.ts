import { createClient } from '@supabase/supabase-js'
import { calculateSeverityScore } from '../lib/utils/severity-scoring'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load .env.local - try multiple locations
const mainRepoPath = '/Users/jordanschepton/Documents/GitHub/Antigravity/book-scanner-app/.env.local'
const envPaths = [
  mainRepoPath, // Try main repo first
  path.join(process.cwd(), '.env.local'),
  '.env.local'
]

let envLoaded = false
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
    envLoaded = true
    console.log(`✅ Loaded .env.local from: ${envPath}`)
    break
  }
}

if (!envLoaded) {
  console.warn('⚠️  Could not find .env.local file')
  console.warn('Tried paths:', envPaths)
}

// Debug: Show what was loaded
console.log('🔍 Environment check:')
console.log('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Found' : '❌ Missing')
console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Found' : '❌ Missing')
console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Found' : '❌ Missing')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://tawolulyrlnpxjyyxpdw.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing Supabase credentials')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌')
  console.error('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌')
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌')
  console.error('   Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')))
  process.exit(1)
}

console.log('✅ Using Supabase URL:', supabaseUrl)
console.log('✅ Using Supabase Key:', supabaseKey.substring(0, 20) + '...')
console.log('')

const supabase = createClient(supabaseUrl, supabaseKey)

async function getBooksWithRankings() {
  const { data: books, error } = await supabase
    .from('books')
    .select(`
      id,
      isbn,
      title,
      author,
      content_warnings (
        id,
        category_id,
        category,
        severity,
        description
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error:', error)
    return
  }

  if (!books || books.length === 0) {
    console.log('No books found in database')
    return
  }

  // Calculate severity scores
  const booksWithScores = books.map(book => {
    const warnings = (book.content_warnings || []).map((w: any) => ({
      severity: w.severity,
      category: w.category,
      category_id: w.category_id,
    }))
    
    return {
      ...book,
      warnings,
      severityScore: calculateSeverityScore(warnings),
      warningCount: {
        severe: warnings.filter((w: any) => w.severity === 'severe').length,
        moderate: warnings.filter((w: any) => w.severity === 'moderate').length,
        mild: warnings.filter((w: any) => w.severity === 'mild').length,
      }
    }
  })

  // Sort by severity (highest first)
  booksWithScores.sort((a, b) => b.severityScore - a.severityScore)

  console.log(`\n📚 DATABASE SUMMARY: ${booksWithScores.length} books\n`)
  console.log('='.repeat(80))
  
  booksWithScores.forEach((book, index) => {
    const rank = index + 1
    const { severe, moderate, mild } = book.warningCount
    const totalWarnings = severe + moderate + mild
    
    console.log(`\n${rank}. ${book.title}`)
    console.log(`   Author: ${book.author || 'Unknown'}`)
    console.log(`   ISBN: ${book.isbn}`)
    console.log(`   Severity Score: ${book.severityScore.toFixed(1)}`)
    console.log(`   Warnings: ${totalWarnings} total (${severe} severe, ${moderate} moderate, ${mild} mild)`)
    
    if (totalWarnings > 0) {
      const topWarnings = book.warnings.slice(0, 3)
      console.log(`   Top warnings: ${topWarnings.map((w: any) => `[${w.severity}] ${w.category_id || w.category}`).join(', ')}`)
    }
  })

  console.log('\n' + '='.repeat(80))
  console.log(`\n📊 STATISTICS:`)
  console.log(`   Total Books: ${booksWithScores.length}`)
  console.log(`   Books with warnings: ${booksWithScores.filter(b => b.warningCount.severe + b.warningCount.moderate + b.warningCount.mild > 0).length}`)
  console.log(`   Books without warnings: ${booksWithScores.filter(b => b.warningCount.severe + b.warningCount.moderate + b.warningCount.mild === 0).length}`)
  console.log(`   Books with severe warnings: ${booksWithScores.filter(b => b.warningCount.severe > 0).length}`)
  console.log(`   Books with moderate warnings: ${booksWithScores.filter(b => b.warningCount.moderate > 0).length}`)
  console.log(`   Books with mild warnings: ${booksWithScores.filter(b => b.warningCount.mild > 0).length}`)
  
  const avgScore = booksWithScores.reduce((sum, b) => sum + b.severityScore, 0) / booksWithScores.length
  const maxScore = Math.max(...booksWithScores.map(b => b.severityScore))
  const minScore = Math.min(...booksWithScores.map(b => b.severityScore))
  
  console.log(`\n   Severity Score Range: ${minScore.toFixed(1)} - ${maxScore.toFixed(1)} (avg: ${avgScore.toFixed(1)})`)
}

getBooksWithRankings().catch(console.error)

