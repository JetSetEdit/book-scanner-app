#!/usr/bin/env tsx
import 'dotenv/config'
import { OpenAI } from 'openai'

async function testWebSearch() {
  console.log('🔍 Testing Web Search for "The Gingerbread Bakery"\n')
  console.log('='.repeat(60))

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  
  const searchPrompt = `Find information about the book "The Gingerbread Bakery" by Laurie Gilmore (ISBN: 9780008728090).

CRITICAL TOS COMPLIANCE: 
- DO NOT use or quote content from retailer websites (Amazon, QBD, Booktopia, Barnes & Noble, etc.) as this may violate their Terms of Service
- DO NOT scrape or reproduce retailer product descriptions
- ONLY use open, publicly available sources that are safe to cite and use

SAFE SOURCES TO USE:
- Open Library (openlibrary.org) - open metadata, safe to use
- Google Books API data - already in public domain via API
- Library catalogs (public library systems, WorldCat, etc.)
- Publisher websites (official publisher descriptions)
- Author websites (official author pages)
- Book review sites that allow citation (Goodreads public reviews, LibraryThing, etc.)
- Wikipedia and other open encyclopedias
- Academic databases with open access
- Community tagging sites (Romance.io, The StoryGraph) - these are public community data

Please provide:
1. A detailed plot summary or book description (2-4 sentences) from SAFE sources only - focus on plot details, character relationships, and story dynamics
2. Romance tropes or themes explicitly mentioned (e.g., "enemies to lovers", "second chance", "fake dating", etc.) - quote the exact phrases used, but ONLY from safe sources like community sites, library catalogs, or publisher/author sites
3. Character relationship dynamics described (e.g., "put aside their dislike", "adversarial", "conflict", etc.)
4. Any content warnings, themes, or sensitive topics mentioned in reviews or discussions (from safe sources)
5. Relationship dynamics or emotional content (conflict, tension, stress, etc.)

CRITICAL: For romance books, specifically look for:
- Enemies-to-lovers dynamics (look for phrases like "enemies to lovers", "enemies-to-lovers", "put aside their dislike", "mutual dislike", etc.) - check community sites like Romance.io or The StoryGraph
- Second chance romance (past breakups, reconciliation stress)
- Fake dating/pretending (deception, lying, secret-keeping)
- Relationship conflict or emotional tension
- Any other romance tropes that might be triggering

IMPORTANT: 
- If you find information that mentions "enemies to lovers" or similar phrases from SAFE sources (community sites, library catalogs, publisher sites), include it
- If the only source is a retailer website, DO NOT quote it - instead, summarize the information in your own words based on what you know from safe sources, or state that information is not available from safe sources
- Community tagging sites (Romance.io, The StoryGraph) are SAFE to use as they are public community data, not retailer content

Be factual and specific. Only quote from sources that are safe to use. If you cannot find information from safe sources, say so explicitly.`

  console.log('📤 Sending web search request to OpenAI...\n')
  
  const searchResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that provides factual information about books based on available knowledge and information. You MUST comply with Terms of Service requirements and only use open, publicly available sources. You MUST NOT quote or reproduce content from retailer websites.'
      },
      {
        role: 'user',
        content: searchPrompt
      }
    ],
    max_tokens: 500
  })

  const messageContent = searchResponse.choices[0]?.message?.content || ''
  
  console.log('📥 Web Search Response:\n')
  console.log('='.repeat(60))
  console.log(messageContent)
  console.log('='.repeat(60))
  
  // Check for retailer content
  const retailerIndicators = [
    'amazon.com', 'qbd.com.au', 'booktopia.com.au', 'barnesandnoble.com',
    'waterstones.com', 'indigo.ca', 'retailer', 'product page', 'buy now',
    'add to cart', 'customer reviews on amazon', 'amazon product description'
  ]
  
  const containsRetailerContent = retailerIndicators.some(indicator => 
    messageContent.toLowerCase().includes(indicator.toLowerCase())
  )
  
  console.log('\n🔍 TOS Compliance Check:')
  console.log(`Contains retailer content: ${containsRetailerContent ? '❌ YES - Would be rejected' : '✅ NO - Safe to use'}`)
  
  // Check for enemies-to-lovers mention
  const hasEnemiesToLovers = messageContent.toLowerCase().includes('enemies') && 
                             (messageContent.toLowerCase().includes('lovers') || 
                              messageContent.toLowerCase().includes('to lovers'))
  
  console.log(`Mentions enemies-to-lovers: ${hasEnemiesToLovers ? '✅ YES' : '❌ NO'}`)
  
  if (hasEnemiesToLovers && !containsRetailerContent) {
    console.log('\n✅ SUCCESS: Found enemies-to-lovers from safe sources!')
  } else if (!hasEnemiesToLovers) {
    console.log('\n⚠️  Did not find enemies-to-lovers information from safe sources')
  } else {
    console.log('\n❌ Found enemies-to-lovers but it contains retailer content - would be rejected')
  }
}

testWebSearch().catch(console.error)

