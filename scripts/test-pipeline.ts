// Load environment variables first
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { WARNING_CATEGORIES } from '../lib/config/taxonomy';
import fs from 'fs';
import path from 'path';

const TEST_BOOKS = [
    { isbn: '9781501110368', title: 'It Ends with Us', expected_rating: 'M' }, // Romance/Abuse
    { isbn: '9780141187761', title: '1984', expected_rating: 'M' }, // Dystopian/Violence
    { isbn: '9780747532743', title: 'Harry Potter and the Philosopher\'s Stone', expected_rating: 'PG' }, // Children's/Fantasy
];

async function runTest() {
    console.log('🚀 Starting AI Pipeline Test...\n');

    // Dynamic import to ensure env vars are loaded
    const { findBookAndGenerateWarnings } = await import('../lib/content-warning-agent');

    const results = [];

    for (const book of TEST_BOOKS) {
        console.log(`Analyzing: ${book.title} (${book.isbn})...`);
        try {
            const startTime = Date.now();
            const result = await findBookAndGenerateWarnings(book.isbn);
            const duration = Date.now() - startTime;

            console.log(`✅ Completed in ${duration}ms`);
            console.log(`   Found: ${result.book_found}`);
            console.log(`   Rating: ${result.classification_rating} (Expected: ${book.expected_rating})`);
            console.log(`   Warnings: ${result.content_warnings.length}`);

            if (result.content_warnings.length > 0) {
                result.content_warnings.forEach(w => {
                    // @ts-ignore - score is present in the new type but might not be in the legacy type definition yet
                    console.log(`     - [${w.category}] ${w.severity} (Score: ${w.score?.toFixed(2)})`);
                });
            }
            console.log('\n');

            results.push({
                isbn: book.isbn,
                title: book.title,
                success: true,
                data: result
            });

        } catch (error) {
            console.error(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
            results.push({
                isbn: book.isbn,
                title: book.title,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    // Save results to file
    const outputPath = path.join(process.cwd(), 'pipeline-test-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`📝 Results saved to ${outputPath}`);
}

runTest().catch(console.error);
