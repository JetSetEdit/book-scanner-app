/**
 * Fetch book cover from multiple sources with fallback
 * Tries: Google Books -> Open Library -> Amazon -> Placeholder
 */
export async function fetchBookCover(isbn: string, title?: string): Promise<string | null> {
    const cleanIsbn = isbn.replace(/[^0-9X]/gi, '');

    // 1. Try Google Books API
    try {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`);
        const data = await response.json();
        if (data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail) {
            const coverUrl = data.items[0].volumeInfo.imageLinks.thumbnail.replace('http:', 'https:');
            // Try to get higher quality version
            const highQualityCover = coverUrl.replace('&zoom=1', '&zoom=2');

            // CRITICAL: Validate the image is actually available (not a placeholder)
            try {
                const imageResponse = await fetch(highQualityCover, { method: 'HEAD' });
                const contentType = imageResponse.headers.get('content-type');
                const contentLength = imageResponse.headers.get('content-length');

                // Google Books placeholder images are usually very small (< 1KB)
                // Real covers are typically > 5KB
                if (imageResponse.ok && contentType?.includes('image') &&
                    contentLength && parseInt(contentLength) > 5000) {
                    console.log(`✅ Google Books cover validated (${contentLength} bytes)`);
                    return highQualityCover;
                } else {
                    console.log(`❌ Google Books cover is a placeholder (${contentLength} bytes), trying fallback...`);
                }
            } catch (e) {
                console.log('Google Books cover validation failed:', e);
            }
        }
    } catch (e) {
        console.log('Google Books cover fetch failed:', e);
    }

    // 2. Try Open Library
    try {
        const response = await fetch(`https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg?default=false`);
        if (response.ok && response.headers.get('content-type')?.includes('image')) {
            const contentLength = response.headers.get('content-length');
            if (contentLength && parseInt(contentLength) > 5000) {
                console.log(`✅ Open Library cover found (${contentLength} bytes)`);
                return `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`;
            }
        }
    } catch (e) {
        console.log('Open Library cover fetch failed:', e);
    }

    // 3. Try Amazon (construct URL - may not always work due to CORS)
    try {
        const amazonCoverUrl = `https://images-na.ssl-images-amazon.com/images/P/${cleanIsbn}.01.LZZZZZZZ.jpg`;
        const response = await fetch(amazonCoverUrl, { method: 'HEAD' });
        if (response.ok) {
            const contentLength = response.headers.get('content-length');
            if (contentLength && parseInt(contentLength) > 5000) {
                console.log(`✅ Amazon cover found (${contentLength} bytes)`);
                return amazonCoverUrl;
            }
        }
    } catch (e) {
        console.log('Amazon cover fetch failed:', e);
    }

    // 4. Try ISBN DB (another fallback)
    try {
        const response = await fetch(`https://isbndb.com/book-image/${cleanIsbn}`);
        if (response.ok) {
            const contentLength = response.headers.get('content-length');
            if (contentLength && parseInt(contentLength) > 5000) {
                console.log(`✅ ISBN DB cover found (${contentLength} bytes)`);
                return `https://isbndb.com/book-image/${cleanIsbn}`;
            }
        }
    } catch (e) {
        console.log('ISBN DB cover fetch failed:', e);
    }

    console.log(`❌ No valid cover found for ISBN ${isbn}`);
    return null;
}

/**
 * Batch fetch covers for multiple ISBNs
 */
export async function fetchBookCovers(isbns: string[]): Promise<Map<string, string | null>> {
    const results = new Map<string, string | null>();

    // Process in parallel with a limit to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < isbns.length; i += batchSize) {
        const batch = isbns.slice(i, i + batchSize);
        const promises = batch.map(async (isbn) => {
            const cover = await fetchBookCover(isbn);
            results.set(isbn, cover);
        });
        await Promise.all(promises);

        // Small delay between batches to be nice to APIs
        if (i + batchSize < isbns.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    return results;
}
