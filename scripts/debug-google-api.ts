
import { normalizeISBN } from '../lib/isbn-validation';

// Mock functions from lib/book-api.ts
function extractISBNsFromGoogleBooks(industryIdentifiers: any[] | undefined): string[] {
    if (!industryIdentifiers) return []

    return industryIdentifiers
        .filter((id: any) => id.type === 'ISBN_10' || id.type === 'ISBN_13')
        .map((id: any) => normalizeISBN(id.identifier))
        .filter(Boolean)
}

function isbnMatches(scannedIsbn: string, returnedISBNs: string[]): boolean {
    const normalizedScanned = normalizeISBN(scannedIsbn)
    return returnedISBNs.some(isbn => normalizeISBN(isbn) === normalizedScanned)
}

async function fetchCandidatesFromGoogleBooks(isbn: string) {
    try {
        const cleanScannedIsbn = normalizeISBN(isbn)
        console.log(`Fetching Google Books for ISBN: ${cleanScannedIsbn}`);

        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanScannedIsbn}`, {
            headers: { 'User-Agent': 'Book-Scanner-App/1.0' }
        })

        if (!response.ok) {
            console.log(`Response not OK: ${response.status}`);
            return []
        }

        const data = await response.json()
        console.log(`Items found: ${data.items ? data.items.length : 0}`);

        if (!data.items || data.items.length === 0) return []

        // Map top 3 results, validate ISBN match, and filter out placeholder titles
        const candidates = data.items.slice(0, 3)
            .map((item: any) => {
                const book = item.volumeInfo
                const returnedISBNs = extractISBNsFromGoogleBooks(book.industryIdentifiers)

                console.log(`Checking book: "${book.title}"`);
                console.log(`Returned ISBNs: ${returnedISBNs.join(', ')}`);

                // CRITICAL: Only include if ISBN matches the scanned ISBN
                if (!isbnMatches(cleanScannedIsbn, returnedISBNs)) {
                    console.warn(`Mismatch! Scanned: ${cleanScannedIsbn}`);
                    return null
                }

                console.log('Match found!');
                return {
                    title: book.title,
                    description: book.description,
                    source: 'googlebooks'
                }
            })
            .filter((c: any) => c !== null);

        return candidates;

    } catch (error) {
        console.error("Error:", error)
        return []
    }
}

async function main() {
    const res = await fetchCandidatesFromGoogleBooks('9780307588371');
    console.log('Result:', JSON.stringify(res, null, 2));
}

main();
