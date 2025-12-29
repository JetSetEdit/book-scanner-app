
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables BEFORE importing the agent
config({ path: resolve(process.cwd(), '.env.local') });
console.log('Loading env from:', resolve(process.cwd(), '.env.local'));

async function runTest() {
    const isbn = process.argv[2] || '9781101904220'; // Default to "Dark Matter" or similar if not provided
    console.log(`Running test for ISBN: ${isbn}`);

    try {
        // Dynamic import to ensure env vars are loaded first
        const { findBookAndGenerateWarnings } = await import('../lib/content-warning-agent');

        const result = await findBookAndGenerateWarnings(isbn);

        console.log('\n--- RESULT ---');
        console.log(`Book Found: ${result.book_found}`);
        console.log(`Title: ${result.book_title}`);
        console.log(`Author: ${result.book_author}`);
        console.log(`Confidence: ${result.confidence}`);
        console.log(`Classification: ${result.classification_rating}`);
        console.log(`Reasoning: ${result.reasoning}`);

        console.log('\n--- WARNINGS ---');
        if (result.content_warnings.length === 0) {
            console.log('No warnings generated.');
        } else {
            result.content_warnings.forEach((w, i) => {
                console.log(`\n[${i + 1}] ${w.category.toUpperCase()} (${w.severity})`);
                console.log(`    Description: ${w.description}`);
                console.log(`    Reasoning: ${w.reasoning}`);
                if (w.is_author_verified) {
                    console.log(`    ✅ VERIFIED SOURCE: ${w.source_url}`);
                }
            });
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

runTest();
