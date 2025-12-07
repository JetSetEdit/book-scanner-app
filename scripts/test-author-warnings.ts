import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Import the agent function
import { findBookAndGenerateWarnings } from '../lib/content-warning-agent';

async function runTest() {
    const isbn = '9781517785703'; // Under the Sugar Sun
    console.log(`Testing author verification for ISBN: ${isbn}...`);

    try {
        const result = await findBookAndGenerateWarnings(isbn);

        console.log('\n--- Result ---');
        console.log('Book Found:', result.book_found);
        console.log('Title:', result.book_title);
        console.log('Author:', result.book_author);
        console.log('Confidence:', result.confidence);

        console.log('\n--- Warnings ---');
        if (result.content_warnings.length > 0) {
            result.content_warnings.forEach(w => {
                console.log(`- [${w.category}] ${w.description} (Score: ${w.score})`);
                console.log(`  Verified: ${w.is_author_verified}`);
                console.log(`  Source: ${w.source_url}`);
            });
        } else {
            console.log('No warnings generated.');
        }

        // Check for verification
        const verifiedWarnings = result.content_warnings.filter(w => w.is_author_verified);
        if (verifiedWarnings.length > 0) {
            console.log('\n✅ SUCCESS: Found author-verified warnings!');
            console.log('Source URL:', verifiedWarnings[0].source_url);
        } else {
            console.log('\n❌ FAILURE: Did not find author-verified warnings.');
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

runTest();
