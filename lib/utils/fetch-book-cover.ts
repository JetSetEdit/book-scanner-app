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
            const baseUrl = data.items[0].volumeInfo.imageLinks.thumbnail.replace('http:', 'https:');
            
            // Try different zoom levels in order of preference (zoom=2 is often the placeholder!)
            // zoom=4 is highest quality, zoom=1 is standard, zoom=2 is often placeholder
            const zoomLevels = [4, 1, 3, 5];
            
            for (const zoom of zoomLevels) {
                const testUrl = baseUrl.replace(/&zoom=\d+/, `&zoom=${zoom}`);
                
                try {
                    const imageResponse = await fetch(testUrl, { method: 'HEAD' });
                    const contentType = imageResponse.headers.get('content-type');
                    const contentLength = imageResponse.headers.get('content-length');

                    // Google Books placeholder images are usually very small (< 1KB)
                    // Real covers are typically > 5KB
                    // Block specific Google Books "Image Not Available" placeholder size (15567 bytes)
                    const size = contentLength ? parseInt(contentLength) : 0;
                    if (imageResponse.ok && contentType?.includes('image') &&
                        size > 5000 && size !== 15567) {
                        console.log(`✅ Google Books cover validated (zoom=${zoom}, ${size} bytes)`);
                        return testUrl;
                    }
                } catch (e) {
                    // Continue to next zoom level
                    continue;
                }
            }
            
            console.log(`❌ Google Books cover validation failed for all zoom levels, trying fallback...`);
        }
    } catch (e) {
        console.log('Google Books cover fetch failed:', e);
    }

    // 2. Try Open Library (without ?default=false to avoid 404s)
    try {
        const url = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`;
        const response = await fetch(url, { method: 'HEAD' });
        // Open Library HEAD requests don't always return content-type, so check if response is OK
        // If it's OK, assume it's a valid image (Open Library only returns images for this endpoint)
        if (response.ok) {
            const contentType = response.headers.get('content-type');
            const contentLength = response.headers.get('content-length');
            const size = contentLength ? parseInt(contentLength) : null;
            
            // If content-type is provided and it's not an image, reject
            if (contentType && !contentType.includes('image')) {
                console.log(`❌ Open Library cover rejected: not an image (${contentType})`);
            } else if (size !== null && size < 1000) {
                // Reject very small images (< 1KB) - likely placeholders
                console.log(`❌ Open Library cover rejected: too small (${size} bytes)`);
            } else if (size === 15567) {
                // Reject Google Books placeholder size
                console.log(`❌ Open Library cover rejected: placeholder size (${size} bytes)`);
            } else {
                // Accept the cover - Open Library covers are generally valid if response is OK
                console.log(`✅ Open Library cover found${size ? ` (${size} bytes)` : ' (no size header)'}`);
                return url;
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
            const size = contentLength ? parseInt(contentLength) : 0;
            if (size > 5000 && size !== 15567) {
                console.log(`✅ Amazon cover found (${size} bytes)`);
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
            const size = contentLength ? parseInt(contentLength) : 0;
            if (size > 5000 && size !== 15567) {
                console.log(`✅ ISBN DB cover found (${size} bytes)`);
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
