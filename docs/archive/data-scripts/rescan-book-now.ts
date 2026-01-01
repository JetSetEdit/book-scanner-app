#!/usr/bin/env tsx

/**
 * Rescan a book with force refresh
 * Usage: npx tsx scripts/rescan-book-now.ts <ISBN>
 */

const isbn = process.argv[2] || '9780349436999'

console.log(`🔄 Rescanning ISBN: ${isbn} (force refresh enabled)`)

async function rescan() {
  try {
    const response = await fetch(`http://localhost:3000/api/scan-isbn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        isbn, 
        stream: false, 
        forceRefresh: true,
        model: 'gpt-4o'
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error(`❌ Failed to rescan: ${response.status} ${response.statusText}`)
      console.error('Error:', error)
      
      if (error.details?.includes('rate limit') || error.details?.includes('429')) {
        console.log('\n⏳ Rate limit hit. Waiting 10 seconds and retrying...')
        await new Promise(resolve => setTimeout(resolve, 10000))
        return rescan() // Retry
      }
      return
    }

    const result = await response.json()
    
    console.log('\n✅ Rescan completed!')
    console.log(`   Book: "${result.book?.title}" by ${result.book?.author}`)
    console.log(`   Warnings Generated: ${result.contentWarningsGenerated ? 'Yes' : 'No'}`)
    console.log(`   Warning Count: ${result.book ? 'Check database' : 'N/A'}`)
    console.log(`   Total Time: ${result.timings?.total?.toFixed(0)}ms`)
    
    if (result.contentWarningsGenerated) {
      console.log('\n✅ Content warnings were generated successfully!')
    } else {
      console.log('\n⚠️  No content warnings were generated.')
      if (result.flags?.isThinMetadata) {
        console.log('   Reason: Thin metadata (no description available)')
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

rescan()

