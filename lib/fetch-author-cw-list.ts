/**
 * Fetches an author's content warnings page and extracts list items for display.
 * Used when books have author_content_warnings_url set.
 * Cached to avoid repeated requests to author sites.
 */

import { unstable_cache } from 'next/cache'

const CACHE_TTL_SECONDS = 86400 // 24 hours
const FETCH_TIMEOUT_MS = 8000

/**
 * Extract list items from HTML or markdown-style text.
 * Handles <li>...</li>, lines starting with - or * or •.
 */
function parseListItems(htmlOrText: string): string[] {
  const trimmed = htmlOrText.trim()
  const items: string[] = []

  // Try HTML <li> first (case-insensitive, allow attributes)
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi
  let match = liRegex.exec(trimmed)
  while (match) {
    const text = match[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim()
    if (text.length > 0) items.push(text)
    match = liRegex.exec(trimmed)
  }

  if (items.length > 0) return items

  // Fallback: markdown-style lines (- or * or • at start)
  const lines = trimmed.split(/\r?\n/)
  for (const line of lines) {
    const stripped = line.replace(/^\s*[-*•]\s+/, '').trim()
    if (stripped.length > 0 && stripped.length < 500) items.push(stripped)
  }

  return items
}

/**
 * Fetch URL and return parsed list of content warning strings.
 * Returns [] on fetch error, timeout, or empty parse.
 */
export async function fetchAuthorContentWarningsListUncached(url: string): Promise<string[]> {
  if (!url || typeof url !== 'string') return []
  const normalized = url.trim()
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) return []

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const res = await fetch(normalized, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SubtextScanner/1.0 (content-warnings)' },
      next: { revalidate: CACHE_TTL_SECONDS },
    })
    clearTimeout(timeoutId)
    if (!res.ok) return []
    const html = await res.text()
    const list = parseListItems(html)
    return list.length > 0 ? list : []
  } catch {
    return []
  }
}

/**
 * Cached wrapper: fetch author CW list, cache by URL for 24h.
 */
export async function fetchAuthorContentWarningsList(url: string): Promise<string[]> {
  if (!url?.trim()) return []
  const normalized = url.trim()
  return unstable_cache(
    () => fetchAuthorContentWarningsListUncached(normalized),
    ['author-cw-list', normalized],
    { revalidate: CACHE_TTL_SECONDS, tags: ['author-cw'] }
  )()
}
