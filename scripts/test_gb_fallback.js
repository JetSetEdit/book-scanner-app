require('dotenv').config({ path: '.env.local' });

async function testGoogleBooksFallback(title, author) {
    try {
        console.log(`Testing Google Books Title/Author fallback for: "${title}" by ${author}...`);

        // URL encode terms
        const query = encodeURIComponent(`intitle:"${title}" inauthor:"${author}"`);
        const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
        const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${apiKey}&maxResults=3`;

        const res = await fetch(url);

        if (!res.ok) {
            console.log(`API Error: ${res.status}`);
            return;
        }

        const data = await res.json();

        if (!data.items || data.items.length === 0) {
            console.log('No books found for this title/author combo.');
            return;
        }

        console.log(`Found ${data.items.length} potential matches.`);

        let bestMatch = null;
        let longestDesc = 0;

        for (const item of data.items) {
            const desc = item.volumeInfo.description || '';
            console.log(`- Match: ${item.volumeInfo.title} (ISBNs: ${(item.volumeInfo.industryIdentifiers || []).map(id => id.identifier).join(', ')})`);
            console.log(`  Description length: ${desc.length}`);

            if (desc.length > longestDesc) {
                longestDesc = desc.length;
                bestMatch = item.volumeInfo;
            }
        }

        if (longestDesc > 0) {
            console.log(`\n✅ SUCCEEDED: Found description via Title/Author search (${longestDesc} chars)`);
            console.log('First 200 chars:', bestMatch.description.substring(0, 200) + '...');
        } else {
            console.log('\n❌ FAILED: Found matches, but none had descriptions.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

// Test with Stranger Things (failed before due to 429)
testGoogleBooksFallback('Stranger Things : Heroes and Monsters', 'Stranger Things');
