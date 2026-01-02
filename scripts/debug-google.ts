
import { fetchCandidatesByISBN } from '../lib/book-api';
import { normalizeISBN } from '../lib/isbn-validation';

async function main() {
    const isbn = '9780307588371';
    console.log('Testing ISBN:', isbn);
    console.log('Normalized:', normalizeISBN(isbn));

    console.log('Fetching candidates...');
    const candidates = await fetchCandidatesByISBN(isbn);
    console.log('Candidates found:', candidates.length);
    candidates.forEach(c => {
        console.log(`- Source: ${c.source}`);
        console.log(`  Title: ${c.title}`);
        console.log(`  Description: ${c.description ? c.description.substring(0, 50) + '...' : 'NONE'}`);
    });
}

main().catch(console.error);
