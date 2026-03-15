/**
 * Fetch a short book description from Wikipedia (summary/extract).
 * Used when external APIs return thin or missing descriptions.
 */

const WIKI_API = 'https://en.wikipedia.org/api/rest_v1/page/summary'

function pageTitleCandidates(title: string, author?: string): string[] {
  const candidates: string[] = []
  if (title === 'It' && author?.toLowerCase().includes('king')) candidates.push('It_(novel)')
  const base = title.replace(/\s+/g, '_')
  candidates.push(`${base}_(novel)`, base)
  return [...new Set(candidates)]
}

/**
 * Get Wikipedia summary/extract for a book by title and optional author.
 * Tries common page title patterns (e.g. "It_(novel)", "Title_(novel)").
 */
export async function getWikipediaSummary(title: string, author?: string): Promise<string | null> {
  for (const pageTitle of pageTitleCandidates(title, author)) {
    const url = `${WIKI_API}/${encodeURIComponent(pageTitle)}`
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const data = await res.json()
      const extract = data.extract ?? data.description
      if (typeof extract === 'string' && extract.length > 100) return extract
    } catch {
      continue
    }
  }
  return null
}
