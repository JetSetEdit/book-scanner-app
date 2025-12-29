/**
 * Hybrid Cache Strategy for TOS Compliance
 * 
 * This implements a "temporary cache" approach that satisfies Google Books API TOS:
 * - Data is stored in DB but treated as a cache
 * - Cache expires after 30 days (staleness check)
 * - Stale data is refreshed in background
 * - This proves we aren't creating a permanent archive
 */

const CACHE_DURATION_DAYS = 30;

/**
 * Check if a book's metadata is stale (>30 days old)
 * This is the key compliance check - stale data proves it's a cache, not a permanent archive
 */
export function isStale(lastSyncedAt: string | null | undefined): boolean {
  if (!lastSyncedAt) return true;
  
  const lastSynced = new Date(lastSyncedAt).getTime();
  const threshold = Date.now() - (CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000);
  return lastSynced < threshold;
}

/**
 * Refresh book metadata from Google Books API in the background
 * This is called when stale data is detected - fire-and-forget to not block the user
 */
export async function refreshBookMetadata(
  isbn: string,
  updateFn: (isbn: string, data: any) => Promise<void>
): Promise<void> {
  try {
    console.log(`[Cache] Refreshing stale metadata for ISBN ${isbn}...`);
    
    // Fetch fresh data from Google Books
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`, {
      next: { revalidate: 86400 },
      headers: {
        'User-Agent': 'Book-Scanner-App/1.0'
      }
    });

    if (!response.ok) {
      console.error(`[Cache] Failed to refresh ${isbn}: HTTP ${response.status}`);
      return;
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      console.log(`[Cache] No data found for ${isbn} during refresh`);
      return;
    }

    // Find first non-placeholder book
    let book = null;
    for (const item of data.items) {
      const volumeInfo = item.volumeInfo;
      if (volumeInfo.title) {
        book = volumeInfo;
        break;
      }
    }

    if (!book) {
      console.log(`[Cache] No valid book found for ${isbn} during refresh`);
      return;
    }

    // Update the database with fresh metadata
    await updateFn(isbn, {
      title: book.title,
      author: book.authors?.[0] || null,
      description: book.description || null,
      cover_url: book.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
      publisher: book.publisher || null,
      published_date: book.publishedDate || null,
      page_count: book.pageCount || null,
      categories: book.categories?.slice(0, 5) || null,
      last_synced_at: new Date().toISOString(), // Reset the timer
    });

    console.log(`[Cache] ✅ Refreshed metadata for ${isbn}`);
  } catch (err) {
    console.error(`[Cache] Error refreshing book ${isbn}:`, err);
  }
}













