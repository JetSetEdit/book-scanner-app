

async function testOpenLibraryWorkFallback(isbn) {
    try {
        console.log(`Testing OpenLibrary Works fallback for ${isbn}...`);
        // Step 1: Get the work key
        const res = await fetch(`https://openlibrary.org/search.json?isbn=${isbn}&fields=key`);
        const data = await res.json();

        if (!data.docs || data.docs.length === 0) {
            console.log('No work found for this ISBN in search.');
            return;
        }

        const workKey = data.docs[0].key;
        console.log(`Found work key: ${workKey}`);

        // Step 2: Fetch the work details which often contain the description
        const workRes = await fetch(`https://openlibrary.org${workKey}.json`);
        const workData = await workRes.json();

        let description = null;
        if (workData.description) {
            if (typeof workData.description === 'string') {
                description = workData.description;
            } else if (workData.description.value) {
                description = workData.description.value;
            }
        }

        if (description) {
            console.log(`\n✅ SUCCEEDED: Found description in Work API (${description.length} chars)`);
            console.log('First 200 chars:', description.substring(0, 200) + '...');
        } else {
            console.log('\n❌ FAILED: No description found even in Work API');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

// Test with Verity
testOpenLibraryWorkFallback('9781408726600');
// Test with Stranger Things
testOpenLibraryWorkFallback('9780241786321');
