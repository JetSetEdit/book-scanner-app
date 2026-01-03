import { fetchCandidatesByISBN } from '../lib/book-api'

async function checkDescription() {
  const isbn = '9780593440872'
  console.log(`Checking description for ISBN: ${isbn}\n`)
  
  const candidates = await fetchCandidatesByISBN(isbn)
  
  if (candidates.length === 0) {
    console.log('❌ No candidates found')
    return
  }
  
  const candidate = candidates[0]
  console.log('✅ Found candidate:')
  console.log(`   Title: ${candidate.title}`)
  console.log(`   Author: ${candidate.author}`)
  console.log(`   Description length: ${candidate.description?.length || 0} chars`)
  console.log(`   Description preview: ${candidate.description?.substring(0, 300) || 'NONE'}`)
  console.log(`   Categories: ${candidate.categories?.join(', ') || 'NONE'}`)
}

checkDescription().catch(console.error)

