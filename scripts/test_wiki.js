async function testWikipediaFallback(title) {
    try {
        console.log(`Testing Wikipedia for: "${title}"...`);

        // First search for the title to get the exact page title
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(title + " book")}&utf8=&format=json`;
        const searchRes = await fetch(searchUrl, {
            headers: { 'User-Agent': 'Book-Scanner-App/1.0' }
        });

        if (!searchRes.ok) return;
        const searchData = await searchRes.json();

        if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
            console.log('❌ No Wikipedia matches found.');
            return;
        }

        const firstMatch = searchData.query.search[0];
        console.log(`Found potential match: ${firstMatch.title}`);

        // Then fetch the extract for that page
        const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(firstMatch.title)}&format=json`;
        const extractRes = await fetch(extractUrl, {
            headers: { 'User-Agent': 'Book-Scanner-App/1.0' }
        });

        const extractData = await extractRes.json();
        const pages = extractData.query.pages;
        const pageId = Object.keys(pages)[0];
        const extract = pages[pageId].extract;

        if (extract && extract.length > 50) {
            console.log(`✅ SUCCEEDED: Found extract (${extract.length} chars)`);
            console.log('First 200 chars:', extract.substring(0, 200).replace(/\n/g, ' ') + '...');
        } else {
            console.log('❌ Extract was empty or too short.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

async function runTests() {
    await testWikipediaFallback('Stranger Things Heroes and Monsters');
    console.log('---');
    await testWikipediaFallback('Brigands & Breadknives');
    console.log('---');
    await testWikipediaFallback('Unravel the Dusk');
    console.log('---');
    await testWikipediaFallback('Burial Rites');
}

runTests();
