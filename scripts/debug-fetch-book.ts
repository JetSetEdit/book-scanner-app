
import { fetchBookByISBN } from '../lib/book-api';

async function main() {
    const isbn = '9780307588371';
    console.log('Fetching book for ISBN:', isbn);

    const book = await fetchBookByISBN(isbn);

    if (book) {
        console.log('✅ Found book!');
        console.log('Title:', book.title);
        console.log('Source:', book.source);
        console.log('Description length:', book.description ? book.description.length : 0);
        console.log('Description start:', book.description ? book.description.substring(0, 100) : 'NONE');
    } else {
        console.log('❌ Book not found');
    }
}

main().catch(console.error);
