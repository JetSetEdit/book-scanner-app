/**
 * Robust book matching logic using Work → Edition → Identifier model
 * Based on FRBR/BIBFRAME principles with confidence scoring
 */

import { supabaseAdmin } from '@/lib/supabase/admin'

export interface BookMetadata {
  title: string
  authors: string[]
  publisher?: string
  pubYear?: number
  binding?: 'paperback' | 'hardcover' | 'ebook' | 'audiobook' | 'other'
  language?: string
  editionStmt?: string
  isbn13?: string
  isbn10?: string
  coverUrl?: string
  description?: string
  categories?: string[]
  externalIds?: Record<string, string>
  source: 'openlibrary' | 'google_books' | 'ai_agent' | 'manual'
}

export interface MatchingResult {
  confidence: 'high' | 'medium' | 'low'
  action: 'link' | 'create_edition' | 'create_work' | 'review'
  workId?: string
  editionId?: string
  reason: string
  candidates?: Array<{
    workId: string
    editionId?: string
    score: number
    reason: string
  }>
}

export interface ProvenanceRecord {
  source: string
  timestamp: string
  confidence: number
  fields: Record<string, any>
}

/**
 * Normalize text for fingerprinting
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/^(the|a|an)\s+/, '') // Remove leading articles
    .trim()
}

/**
 * Create work fingerprint for clustering
 */
function createWorkFingerprint(
  title: string,
  authors: string[],
  language: string = 'en'
): string {
  const normTitle = normalizeText(title)
  const normAuthors = authors
    .map(author => normalizeText(author))
    .sort()
    .join('|')
  
  return `${normTitle}|${normAuthors}|${language}`
}

/**
 * Create edition fingerprint for deduplication
 */
function createEditionFingerprint(
  publisher?: string,
  pubYear?: number,
  binding?: string,
  language: string = 'en',
  editionStmt?: string
): string {
  const normPublisher = normalizeText(publisher || '')
  const normEditionStmt = normalizeText(editionStmt || '')
  
  return `${normPublisher}|${pubYear || ''}|${binding || ''}|${language}|${normEditionStmt}`
}

/**
 * Calculate fuzzy match score between two strings
 */
function calculateFuzzyScore(str1: string, str2: string): number {
  const s1 = normalizeText(str1)
  const s2 = normalizeText(str2)
  
  if (s1 === s2) return 1.0
  
  // Simple Jaro-Winkler-like scoring
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1
  
  if (longer.length === 0) return 1.0
  
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }
  
  return matrix[str2.length][str1.length]
}

/**
 * Find existing work by fingerprint and fuzzy matching
 */
async function findExistingWork(
  title: string,
  authors: string[],
  language: string = 'en'
): Promise<Array<{ workId: string; score: number; reason: string }>> {
  const workFp = createWorkFingerprint(title, authors, language)
  
  // First try exact fingerprint match
  const { data: exactMatch } = await supabaseAdmin
    .from('works')
    .select('id, canonical_title, primary_contributors')
    .eq('work_fp', workFp)
    .limit(1)
  
  if (exactMatch && exactMatch.length > 0) {
    return [{
      workId: exactMatch[0].id,
      score: 1.0,
      reason: 'Exact fingerprint match'
    }]
  }
  
  // Fuzzy search for similar works
  const { data: candidates } = await supabaseAdmin
    .from('works')
    .select('id, canonical_title, primary_contributors, work_fp')
    .eq('language_work', language)
    .limit(20)
  
  if (!candidates) return []
  
  const results = candidates
    .map(candidate => {
      const candidateTitle = candidate.canonical_title
      const candidateAuthors = (candidate.primary_contributors as any[])
        .filter(c => c.role === 'author')
        .map(c => c.name)
      
      const titleScore = calculateFuzzyScore(title, candidateTitle)
      const authorScore = authors.length > 0 && candidateAuthors.length > 0
        ? Math.max(...authors.map(author => 
            Math.max(...candidateAuthors.map(candidateAuthor => 
              calculateFuzzyScore(author, candidateAuthor)
            ))
          ))
        : 0
      
      const combinedScore = (titleScore * 0.7) + (authorScore * 0.3)
      
      return {
        workId: candidate.id,
        score: combinedScore,
        reason: `Title: ${titleScore.toFixed(2)}, Authors: ${authorScore.toFixed(2)}`
      }
    })
    .filter(result => result.score > 0.6) // Threshold for fuzzy matching
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
  
  return results
}

/**
 * Find existing edition within a work
 */
async function findExistingEdition(
  workId: string,
  publisher?: string,
  pubYear?: number,
  binding?: string,
  language: string = 'en',
  editionStmt?: string
): Promise<Array<{ editionId: string; score: number; reason: string }>> {
  const editionFp = createEditionFingerprint(publisher, pubYear, binding, language, editionStmt)
  
  // Try exact fingerprint match first
  const { data: exactMatch } = await supabaseAdmin
    .from('editions')
    .select('id, publisher, pub_year, binding, edition_stmt')
    .eq('work_id', workId)
    .eq('edition_fp', editionFp)
    .limit(1)
  
  if (exactMatch && exactMatch.length > 0) {
    return [{
      editionId: exactMatch[0].id,
      score: 1.0,
      reason: 'Exact edition fingerprint match'
    }]
  }
  
  // Fuzzy search within the work
  const { data: candidates } = await supabaseAdmin
    .from('editions')
    .select('id, publisher, pub_year, binding, edition_stmt, edition_fp')
    .eq('work_id', workId)
    .limit(10)
  
  if (!candidates) return []
  
  const results = candidates
    .map(candidate => {
      const publisherScore = publisher ? calculateFuzzyScore(publisher, candidate.publisher || '') : 0.5
      const yearScore = pubYear && candidate.pub_year 
        ? Math.abs(pubYear - candidate.pub_year) <= 1 ? 1.0 : 0.3
        : 0.5
      const bindingScore = binding && candidate.binding
        ? binding === candidate.binding ? 1.0 : 0.2
        : 0.5
      
      const combinedScore = (publisherScore * 0.4) + (yearScore * 0.3) + (bindingScore * 0.3)
      
      return {
        editionId: candidate.id,
        score: combinedScore,
        reason: `Publisher: ${publisherScore.toFixed(2)}, Year: ${yearScore.toFixed(2)}, Binding: ${bindingScore.toFixed(2)}`
      }
    })
    .filter(result => result.score > 0.7)
    .sort((a, b) => b.score - a.score)
  
  return results
}

/**
 * Main matching function
 */
export async function matchBook(
  isbn: string,
  metadata: BookMetadata
): Promise<MatchingResult> {
  console.log(`[Book Matching] Processing ISBN: ${isbn}`)
  console.log(`[Book Matching] Metadata:`, metadata)
  
  // Step 1: Check if ISBN already exists
  const { data: existingIdentifier } = await supabaseAdmin
    .from('identifiers')
    .select(`
      id,
      edition_id,
      editions!inner(
        id,
        work_id,
        works!inner(id, canonical_title)
      )
    `)
    .eq('value', isbn)
    .limit(1)
  
  if (existingIdentifier && existingIdentifier.length > 0) {
    const identifier = existingIdentifier[0]
    return {
      confidence: 'high',
      action: 'link',
      workId: identifier.editions.work_id,
      editionId: identifier.edition_id,
      reason: 'ISBN already exists in database'
    }
  }
  
  // Step 2: Find existing work
  const workCandidates = await findExistingWork(
    metadata.title,
    metadata.authors,
    metadata.language
  )
  
  if (workCandidates.length === 0) {
    return {
      confidence: 'high',
      action: 'create_work',
      reason: 'No existing work found, will create new work and edition'
    }
  }
  
  const bestWork = workCandidates[0]
  
  // Step 3: Find existing edition within the work
  const editionCandidates = await findExistingEdition(
    bestWork.workId,
    metadata.publisher,
    metadata.pubYear,
    metadata.binding,
    metadata.language,
    metadata.editionStmt
  )
  
  if (editionCandidates.length > 0) {
    const bestEdition = editionCandidates[0]
    return {
      confidence: bestEdition.score > 0.9 ? 'high' : 'medium',
      action: 'link',
      workId: bestWork.workId,
      editionId: bestEdition.editionId,
      reason: `Found existing edition: ${bestEdition.reason}`,
      candidates: [{
        workId: bestWork.workId,
        editionId: bestEdition.editionId,
        score: bestEdition.score,
        reason: bestEdition.reason
      }]
    }
  }
  
  // Step 4: Create new edition under existing work
  if (bestWork.score > 0.8) {
    return {
      confidence: 'high',
      action: 'create_edition',
      workId: bestWork.workId,
      reason: `Found existing work, will create new edition: ${bestWork.reason}`,
      candidates: [{
        workId: bestWork.workId,
        score: bestWork.score,
        reason: bestWork.reason
      }]
    }
  }
  
  // Step 5: Low confidence - needs review
  return {
    confidence: 'low',
    action: 'review',
    reason: `Low confidence match: ${bestWork.reason}`,
    candidates: workCandidates.slice(0, 3)
  }
}

/**
 * Create work, edition, and identifier records
 */
export async function createBookRecord(
  isbn: string,
  metadata: BookMetadata,
  workId?: string
): Promise<{ workId: string; editionId: string; identifierId: string }> {
  console.log(`[Book Creation] Creating records for ISBN: ${isbn}`)
  
  let finalWorkId = workId
  
  // Create work if not provided
  if (!finalWorkId) {
    const { data: newWork, error: workError } = await supabaseAdmin
      .from('works')
      .insert({
        canonical_title: metadata.title,
        language_work: metadata.language || 'en',
        primary_contributors: metadata.authors.map(author => ({
          role: 'author',
          name: author
        })),
        original_pub_year: metadata.pubYear,
        external_ids: metadata.externalIds || {}
      })
      .select('id')
      .single()
    
    if (workError) throw workError
    finalWorkId = newWork.id
    console.log(`[Book Creation] Created work: ${finalWorkId}`)
  }
  
  // Create edition
  const { data: newEdition, error: editionError } = await supabaseAdmin
    .from('editions')
    .insert({
      work_id: finalWorkId,
      publisher: metadata.publisher,
      pub_year: metadata.pubYear,
      binding: metadata.binding || 'other',
      language_edition: metadata.language || 'en',
      edition_stmt: metadata.editionStmt,
      page_count: null, // Will be filled from metadata if available
      cover_url: metadata.coverUrl,
      description: metadata.description,
      categories: metadata.categories,
      external_ids: metadata.externalIds || {}
    })
    .select('id')
    .single()
  
  if (editionError) throw editionError
  console.log(`[Book Creation] Created edition: ${newEdition.id}`)
  
  // Create identifier
  const { data: newIdentifier, error: identifierError } = await supabaseAdmin
    .from('identifiers')
    .insert({
      edition_id: newEdition.id,
      id_type: isbn.length === 13 ? 'isbn13' : 'isbn10',
      value: isbn,
      is_primary: true,
      source: metadata.source
    })
    .select('id')
    .single()
  
  if (identifierError) throw identifierError
  console.log(`[Book Creation] Created identifier: ${newIdentifier.id}`)
  
  return {
    workId: finalWorkId,
    editionId: newEdition.id,
    identifierId: newIdentifier.id
  }
}

