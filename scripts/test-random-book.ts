/**
 * Test All Agent Configurations with Random Book
 * 
 * Randomly selects an ISBN from the GoodBooks dataset and runs
 * all agent configurations against it.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

function loadRandomISBNs(count: number = 10): Array<{isbn: string, title: string, author: string}> {
  const datasetPath = join(process.cwd(), 'data', 'datasets', 'goodbooks-10k-github', 'books.csv')
  
  try {
    const fileContent = readFileSync(datasetPath, 'utf-8')
    const lines = fileContent.split('\n').filter(l => l.trim())
    
    if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows')
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const isbn13Index = headers.indexOf('isbn13')
    const titleIndex = headers.indexOf('title')
    const authorIndex = headers.indexOf('authors')
    
    if (isbn13Index === -1) {
      throw new Error('isbn13 column not found in CSV')
    }
    
    // Collect all valid ISBN-13s with metadata
    const validBooks: Array<{isbn: string, title: string, author: string}> = []
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.length > isbn13Index) {
        const isbn13 = values[isbn13Index]?.replace(/"/g, '').trim()
        // Convert scientific notation to regular number if needed
        let isbn = isbn13
        if (isbn13.includes('e+') || isbn13.includes('E+')) {
          isbn = parseFloat(isbn13).toString()
        }
        // Validate: should be 13 digits
        if (isbn && /^\d{13}$/.test(isbn)) {
          const title = titleIndex !== -1 && values.length > titleIndex 
            ? values[titleIndex]?.replace(/"/g, '').trim() || 'Unknown'
            : 'Unknown'
          const author = authorIndex !== -1 && values.length > authorIndex
            ? values[authorIndex]?.replace(/"/g, '').trim() || 'Unknown'
            : 'Unknown'
          
          validBooks.push({ isbn, title, author })
        }
      }
    }
    
    if (validBooks.length === 0) {
      throw new Error('No valid ISBN-13s found in dataset')
    }
    
    // Shuffle and pick first N
    const shuffled = [...validBooks].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(count, shuffled.length))
  } catch (error) {
    console.error('Error loading random ISBNs:', error)
    throw error
  }
}

async function testISBN(isbn: string, title: string, author: string): Promise<boolean> {
  // Quick test to see if book can be found
  try {
    const { fetchCandidatesByISBN } = await import('../lib/book-api')
    const candidates = await fetchCandidatesByISBN(isbn)
    return candidates && candidates.length > 0
  } catch {
    return false
  }
}

async function main() {
  console.log('🎲 Selecting random book from GoodBooks dataset...\n')
  
  try {
    // Load multiple random books to try
    const candidateBooks = loadRandomISBNs(5)
    
    console.log(`📚 Trying ${candidateBooks.length} random books until one is found...\n`)
    
    let selectedBook: {isbn: string, title: string, author: string} | null = null
    
    for (const book of candidateBooks) {
      console.log(`   Testing: "${book.title}" by ${book.author} (${book.isbn})...`)
      const found = await testISBN(book.isbn, book.title, book.author)
      if (found) {
        selectedBook = book
        console.log(`   ✅ Found! Using this book.\n`)
        break
      } else {
        console.log(`   ❌ Not found in Google Books API, trying next...\n`)
      }
    }
    
    if (!selectedBook) {
      console.log('⚠️  None of the random books were found. Using a known good ISBN...')
      // Fallback to a known good ISBN
      selectedBook = {
        isbn: '9780593440872',
        title: 'Book Lovers',
        author: 'Emily Henry'
      }
    }
    
    console.log(`📚 Selected Book:`)
    console.log(`   Title: ${selectedBook.title}`)
    console.log(`   Author: ${selectedBook.author}`)
    console.log(`   ISBN: ${selectedBook.isbn}\n`)
    console.log('═'.repeat(60))
    console.log('')
    
    // Run the test script with the selected ISBN
    console.log('🚀 Running agent tests...\n')
    execSync(`npx tsx scripts/test-all-agent-configs.ts ${selectedBook.isbn}`, {
      stdio: 'inherit',
      cwd: process.cwd()
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

main().catch(console.error)

