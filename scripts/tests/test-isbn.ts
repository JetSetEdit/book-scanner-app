/**
 * Test what a specific ISBN would return
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

async function testISBN(isbn: string) {
  console.log(`\n🔍 Testing ISBN: ${isbn}\n`)
  console.log('='.repeat(60))

  // 1. Google Books
  console.log('\n📚 Google Books API:')
  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`)
    const data = await response.json()
    
    if (data.items?.[0]?.volumeInfo) {
      const book = data.items[0].volumeInfo
      console.log(`  Title: ${book.title}`)
      console.log(`  Author: ${book.authors?.join(', ')}`)
      console.log(`  Description: ${book.description ? book.description.substring(0, 100) + '...' : 'None'}`)
      console.log(`  Description Length: ${book.description?.length || 0} chars`)
      
      if (book.imageLinks) {
        console.log(`  Cover URLs available:`)
        Object.entries(book.imageLinks).forEach(([size, url]) => {
          console.log(`    ${size}: ${url}`)
        })
        
        // Test validation
        const thumbnail = book.imageLinks.thumbnail?.replace('http:', 'https:')
        const highQuality = thumbnail?.replace('&zoom=1', '&zoom=2')
        
        if (highQuality) {
          console.log(`\n  Testing cover validation for: ${highQuality.substring(0, 80)}...`)
          try {
            const imgResponse = await fetch(highQuality, { method: 'HEAD' })
            const contentType = imgResponse.headers.get('content-type')
            const contentLength = imgResponse.headers.get('content-length')
            const size = contentLength ? parseInt(contentLength) : null
            
            console.log(`    Status: ${imgResponse.status}`)
            console.log(`    Content-Type: ${contentType || 'None'}`)
            console.log(`    Size: ${size ? `${size} bytes` : 'Unknown'}`)
            
            if (imgResponse.ok && contentType?.includes('image')) {
              if (size && size > 5000 && size !== 15567) {
                console.log(`    ✅ VALID COVER`)
              } else if (size === 15567) {
                console.log(`    ❌ PLACEHOLDER (15,567 bytes)`)
              } else if (size && size < 5000) {
                console.log(`    ❌ TOO SMALL (${size} bytes < 5KB)`)
              } else {
                console.log(`    ⚠️  UNKNOWN (no size header)`)
              }
            } else {
              console.log(`    ❌ INVALID (not an image or bad response)`)
            }
          } catch (e) {
            console.log(`    ❌ VALIDATION FAILED: ${e instanceof Error ? e.message : 'Unknown'}`)
          }
        }
      } else {
        console.log(`  ❌ No cover URLs found`)
      }
    } else {
      console.log(`  ❌ Book not found`)
    }
  } catch (e) {
    console.log(`  ❌ Error: ${e instanceof Error ? e.message : 'Unknown'}`)
  }

  // 2. Open Library
  console.log('\n📖 Open Library API:')
  try {
    const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`)
    const data = await response.json()
    const book = data[`ISBN:${isbn}`]
    
    if (book) {
      console.log(`  Title: ${book.title}`)
      console.log(`  Author: ${book.authors?.[0]?.name || 'Unknown'}`)
      console.log(`  Description: ${book.excerpts?.[0]?.text ? book.excerpts[0].text.substring(0, 100) + '...' : 'None'}`)
      console.log(`  Description Length: ${book.excerpts?.[0]?.text?.length || 0} chars`)
      
      const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
      console.log(`  Cover URL: ${coverUrl}`)
      
      try {
        const imgResponse = await fetch(coverUrl, { method: 'HEAD' })
        console.log(`    Status: ${imgResponse.status}`)
        console.log(`    Content-Type: ${imgResponse.headers.get('content-type') || 'None'}`)
        const size = imgResponse.headers.get('content-length')
        console.log(`    Size: ${size ? `${size} bytes` : 'Unknown'}`)
        
        if (imgResponse.ok) {
          console.log(`    ✅ COVER EXISTS`)
        } else {
          console.log(`    ❌ COVER NOT FOUND`)
        }
      } catch (e) {
        console.log(`    ❌ VALIDATION FAILED: ${e instanceof Error ? e.message : 'Unknown'}`)
      }
    } else {
      console.log(`  ❌ Book not found`)
    }
  } catch (e) {
    console.log(`  ❌ Error: ${e instanceof Error ? e.message : 'Unknown'}`)
  }

  // 3. Predict what the scan would do
  console.log('\n🔮 Predicted Scan Behavior:')
  console.log('─'.repeat(60))
  
  // Check if metadata would be considered "thin"
  const gbResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`)
  const gbData = await gbResponse.json()
  const book = gbData.items?.[0]?.volumeInfo
  
  if (book) {
    const hasDescription = !!book.description
    const descLength = book.description?.length || 0
    const hasCover = !!book.imageLinks?.thumbnail
    
    const isThinMetadata = !hasDescription || descLength < 150 || !hasCover
    
    console.log(`  Metadata Quality: ${isThinMetadata ? '❌ THIN' : '✅ GOOD'}`)
    console.log(`    - Description: ${hasDescription ? `✅ ${descLength} chars` : '❌ Missing'}`)
    console.log(`    - Cover: ${hasCover ? '✅ Available' : '❌ Missing'}`)
    
    if (isThinMetadata) {
      console.log(`\n  → Would trigger AI agent web search (thin metadata)`)
      console.log(`  → AI would search: Google Books, Open Library, etc.`)
      console.log(`  → AI would generate content warnings`)
    } else {
      console.log(`\n  → Would use metadata-based analysis first`)
      console.log(`  → If no warnings found, would verify with web search`)
      console.log(`  → Would generate content warnings from metadata`)
    }
  }
}

const isbn = process.argv[2] || '9781419773792'
testISBN(isbn).catch(console.error)







