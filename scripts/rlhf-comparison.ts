#!/usr/bin/env tsx

/**
 * RLHF Comparison Tool
 * 
 * Shows you two books and asks which one you think is more severe.
 * Your choices help train/improve the severity scoring system.
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'
import * as readline from 'readline'
import { calculateSeverityScore } from '../lib/utils/severity-scoring'

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

interface BookComparison {
  bookA: {
    id: string
    title: string
    author: string
    isbn: string
    score: number
    warnings: Array<{
      severity: string
      category_id: string
      description: string
    }>
  }
  bookB: {
    id: string
    title: string
    author: string
    isbn: string
    score: number
    warnings: Array<{
      severity: string
      category_id: string
      description: string
    }>
  }
  userChoice: 'A' | 'B' | 'equal' | null
  timestamp: string
}

function question(rl: readline.Interface, query: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(query, resolve)
  })
}

async function getRandomBooks(count: number = 2) {
  const { data: books } = await supabase
    .from('books')
    .select('id, title, author, isbn')
    .limit(100) // Get a pool to choose from

  if (!books || books.length < count) {
    throw new Error('Not enough books in database')
  }

  // Shuffle and pick random books
  const shuffled = [...books].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

async function getBookWithWarnings(bookId: string) {
  const { data: book } = await supabase
    .from('books')
    .select('id, title, author, isbn')
    .eq('id', bookId)
    .single()

  if (!book) return null

  const { data: warnings } = await supabase
    .from('content_warnings')
    .select('severity, category_id, description')
    .eq('book_id', bookId)

  const score = calculateSeverityScore(
    (warnings || []).map(w => ({
      severity: w.severity as 'mild' | 'moderate' | 'severe',
      category_id: w.category_id || undefined,
      category: w.category_id || undefined
    }))
  )

  return {
    ...book,
    score,
    warnings: warnings || []
  }
}

function displayBook(book: any, label: string) {
  const severe = book.warnings.filter((w: any) => w.severity === 'severe').length
  const moderate = book.warnings.filter((w: any) => w.severity === 'moderate').length
  const mild = book.warnings.filter((w: any) => w.severity === 'mild').length

  console.log(`\n${'='.repeat(80)}`)
  console.log(`${label}: ${book.title}`)
  console.log(`Author: ${book.author}`)
  console.log(`ISBN: ${book.isbn}`)
  console.log(`Current Score: ${book.score.toFixed(1)}`)
  console.log(`Warnings: ${severe} severe, ${moderate} moderate, ${mild} mild`)
  console.log(`\nContent Warnings:`)
  
  book.warnings.forEach((w: any, i: number) => {
    console.log(`  ${i + 1}. [${w.severity.toUpperCase()}] ${w.category_id || 'unknown'}`)
    console.log(`     "${w.description}"`)
  })
  console.log('='.repeat(80))
}

async function saveComparison(comparison: BookComparison) {
  // Save to JSON file for analysis
  const filePath = path.join(process.cwd(), 'rlhf-comparisons.json')
  let comparisons: BookComparison[] = []
  
  if (fs.existsSync(filePath)) {
    comparisons = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  }
  
  comparisons.push(comparison)
  fs.writeFileSync(filePath, JSON.stringify(comparisons, null, 2))
}

async function runComparison() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  console.log('\n🎯 RLHF Comparison Tool')
  console.log('='.repeat(80))
  console.log('I\'ll show you two books. Choose which one you think is MORE SEVERE.')
  console.log('Your feedback will help improve the scoring system.\n')

  try {
    // Get two random books
    const books = await getRandomBooks(2)
    const bookA = await getBookWithWarnings(books[0].id)
    const bookB = await getBookWithWarnings(books[1].id)

    if (!bookA || !bookB) {
      console.error('Failed to fetch book data')
      rl.close()
      return
    }

    // Display both books
    displayBook(bookA, 'BOOK A')
    displayBook(bookB, 'BOOK B')

    // Ask for user choice
    console.log('\n🤔 Which book do you think is MORE SEVERE?')
    console.log('  [A] Book A is more severe')
    console.log('  [B] Book B is more severe')
    console.log('  [E] They are equally severe')
    console.log('  [S] Skip this comparison')
    
    const choice = await question(rl, '\nYour choice (A/B/E/S): ')

    if (choice.toUpperCase() === 'S') {
      console.log('Skipped.')
      rl.close()
      return
    }

    let userChoice: 'A' | 'B' | 'equal' | null = null
    if (choice.toUpperCase() === 'A') userChoice = 'A'
    else if (choice.toUpperCase() === 'B') userChoice = 'B'
    else if (choice.toUpperCase() === 'E') userChoice = 'equal'
    else {
      console.log('Invalid choice. Skipping.')
      rl.close()
      return
    }

    // Save comparison
    const comparison: BookComparison = {
      bookA: {
        id: bookA.id,
        title: bookA.title,
        author: bookA.author,
        isbn: bookA.isbn,
        score: bookA.score,
        warnings: bookA.warnings
      },
      bookB: {
        id: bookB.id,
        title: bookB.title,
        author: bookB.author,
        isbn: bookB.isbn,
        score: bookB.score,
        warnings: bookB.warnings
      },
      userChoice,
      timestamp: new Date().toISOString()
    }

    await saveComparison(comparison)

    // Show what the system predicted vs user choice
    console.log('\n📊 Comparison Result:')
    console.log(`  System predicted: ${bookA.score > bookB.score ? 'A' : bookB.score > bookA.score ? 'B' : 'Equal'}`)
    console.log(`  Your choice: ${userChoice}`)
    
    if (userChoice === 'equal') {
      console.log(`  Difference: ${Math.abs(bookA.score - bookB.score).toFixed(1)} points`)
    } else {
      const systemChoice = bookA.score > bookB.score ? 'A' : 'B'
      const match = systemChoice === userChoice
      console.log(`  Match: ${match ? '✅' : '❌'}`)
      if (!match) {
        console.log(`  Score difference: ${Math.abs(bookA.score - bookB.score).toFixed(1)} points`)
      }
    }

    console.log('\n✅ Comparison saved to rlhf-comparisons.json')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    rl.close()
  }
}

runComparison().catch(console.error)

