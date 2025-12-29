import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function debugSearch() {
    const { performWebSearch } = await import('@/lib/content-warning-agent');

    const query = 'Guinness World Records 2026 9781913484835';
    console.log(`🔍 Debugging search for: "${query}"`);

    try {
        const result = await performWebSearch({ query });
        console.log('\n--- Tool Output ---');
        console.log(result);
    } catch (error) {
        console.error('❌ Search failed:', error);
    }
}

debugSearch();
