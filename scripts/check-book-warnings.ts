#!/usr/bin/env tsx
/**
 * Check a book's warnings and rating
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function main() {
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  const searchTerm = process.argv[2] || 'Normal People'
  
  // Try ISBN first (remove dashes/spaces), then title
  let book
  const cleanIsbn = searchTerm.replace(/[-\s]/g, '')
  if (cleanIsbn.match(/^\d{10,13}$/)) {
    // Try exact match first
    let { data } = await supabase
      .from('books')
      .select('id, title, age_rating, isbn')
      .eq('isbn', cleanIsbn)
      .maybeSingle()
    if (!data) {
      // Try with dashes
      const withDashes = cleanIsbn.replace(/(\d{3})(\d{1})(\d{5})(\d{3})(\d{1})/, '$1-$2-$3-$4-$5')
      const { data: data2 } = await supabase
        .from('books')
        .select('id, title, age_rating, isbn')
        .eq('isbn', withDashes)
        .maybeSingle()
      data = data2
    }
    book = data
  } else {
    const { data } = await supabase
      .from('books')
      .select('id, title, age_rating, isbn')
      .ilike('title', `%${searchTerm}%`)
      .limit(1)
    book = data?.[0]
  }
  
  if (!book) {
    console.log(`Book "${searchTerm}" not found`)
    // List all books
    const { data: allBooks } = await supabase
      .from('books')
      .select('isbn, title')
      .order('created_at', { ascending: false })
      .limit(10)
    console.log('\nAvailable books:')
    allBooks?.forEach(b => console.log(`  ${b.isbn} - ${b.title}`))
    return
  }
  
  console.log(`\n📖 ${book.title}`)
  console.log(`   Current Rating: ${book.age_rating || 'N/A'}`)
  
  const { data: warnings } = await supabase
    .from('content_warnings')
    .select('subcategory_id, severity, severity_signals, description')
    .eq('book_id', book.id)
  
  console.log(`\n   Warnings (${warnings?.length || 0}):`)
  
  if (warnings && warnings.length > 0) {
    warnings.forEach(w => {
      const signals = (w.severity_signals as any) || {}
      const proximity = signals.proximity ?? 0.5
      const explicitness = signals.explicitness ?? 0.5
      const frequency = signals.frequency ?? 0.5
      
      // Check explicit flag
      const categoryId = w.subcategory_id?.split('.')[0] || 'other'
      const isExplicit = categoryId === 'sexual_content' && 
                        proximity >= 0.9 && 
                        explicitness >= 0.6 &&
                        frequency >= 0.35
      
      console.log(`\n   - ${w.subcategory_id}`)
      console.log(`     Severity: ${w.severity}`)
      console.log(`     Signals: proximity=${proximity.toFixed(2)}, explicitness=${explicitness.toFixed(2)}, frequency=${frequency.toFixed(2)}`)
      console.log(`     Explicit flag: ${isExplicit ? '✅ YES' : '❌ NO'}`)
      console.log(`     Description: ${w.description || 'N/A'}`)
    })
    
    // Calculate rating
    const { calculateAgeRating } = await import('../lib/utils/age-rating')
    const { EnhancedContentWarning } = await import('../lib/config/taxonomy-context')
    
    const enhancedWarnings: EnhancedContentWarning[] = warnings.map(w => ({
      subcategory_id: w.subcategory_id || undefined,
      severity: w.severity as 'mild' | 'moderate' | 'severe',
      modifiers: [],
      evidence: [],
      severity_signals: (w.severity_signals as any) || undefined,
      description: w.description || undefined
    }))
    
    const rating = calculateAgeRating(enhancedWarnings)
    console.log(`\n   📊 Calculated Rating: ${rating.rating}`)
    console.log(`   Reasoning: ${rating.reasoning}`)
  } else {
    console.log('   No warnings found')
  }
}

main().catch(console.error)

