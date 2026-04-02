import { fetchBookByISBN } from '../lib/book-api';

async function testFetch() {
    console.log('Testing fetchBookByISBN for Verity (9781408726600)...');
    const result = await fetchBookByISBN('9781408726600');

    if (!result) {
        console.log('Book not found.');
        return;
    }

    console.log(`\nTitle: ${result.title}`);
    console.log(`Author: ${result.author}`);
    console.log(`Source: ${result.source}`);
    console.log(`Description length: ${result.description ? result.description.length : 'MISSING'}`);
    if (result.description) {
        console.log(`First 100 chars: ${result.description.substring(0, 100)}...`);
    }
}

testFetch();
