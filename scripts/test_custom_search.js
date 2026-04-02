require('dotenv').config({ path: '.env.local' });

async function performWebSearch(query) {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY
    const cx = process.env.GOOGLE_SEARCH_ENGINE_ID

    try {
        const url = new URL('https://www.googleapis.com/customsearch/v1')
        url.searchParams.append('key', apiKey)
        url.searchParams.append('cx', cx)
        url.searchParams.append('q', query)
        url.searchParams.append('num', '3')

        const res = await fetch(url.toString())
        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data = await res.json()
        if (!data.items) return [];

        return data.items.map((item) => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet
        }))
    } catch (error) {
        console.error('Search failed:', error)
        return []
    }
}

async function testGoodreadsSnippetFallback(title, author) {
    console.log(`Testing Custom Search fallback for: "${title}"...`);
    const query = `site:goodreads.com/book/show "${title}" ${author || ''}`;
    console.log(`Query: ${query}`);

    const results = await performWebSearch(query);

    if (results.length > 0) {
        console.log(`✅ SUCCEEDED: Found ${results.length} results.`);
        console.log(`Title: ${results[0].title}`);
        console.log(`Snippet: ${results[0].snippet}`);
        console.log(`Snippet length: ${results[0].snippet.length} chars`);
    } else {
        console.log('❌ FAILED: No results found.');
    }
}

testGoodreadsSnippetFallback('Stranger Things Heroes and Monsters', '');
console.log('---');
testGoodreadsSnippetFallback('Brigands & Breadknives', 'Travis Baldree');
