
import fs from 'fs';
import path from 'path';

async function testAgent(isbn: string) {
    // 1. Manually load env vars FIRST
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
    } else {
        console.error("Could not find .env.local");
        process.exit(1);
    }

    // 2. Dynamically import the agent AFTER env vars are set
    const { findBookAndGenerateWarnings } = await import('../lib/content-warning-agent');

    console.log(`🧪 Testing AI Agent for ISBN: ${isbn}`);
    console.log('----------------------------------------');

    try {
        const startTime = Date.now();
        const result = await findBookAndGenerateWarnings(isbn);
        const endTime = Date.now();

        console.log(`\n✅ Agent Finished in ${(endTime - startTime) / 1000}s`);
        console.log('----------------------------------------');

        console.log(`Book Found: ${result.book_found}`);
        if (result.book_found) {
            console.log(`Title: ${result.book_title}`);
            console.log(`Author: ${result.book_author}`);
            console.log(`Description: ${result.book_description?.substring(0, 100)}...`);
            console.log(`Categories: ${result.book_categories}`);

            console.log(`\n⚠️ Content Warnings (${result.content_warnings.length}):`);
            result.content_warnings.forEach(w => {
                console.log(`- [${w.severity}] ${w.category}: ${w.description}`);
                console.log(`  Reasoning: ${w.reasoning}`);
            });

            console.log(`\n📊 Classification: ${result.classification_rating}`);
            console.log(`Confidence: ${result.confidence}`);
            console.log(`Reasoning: ${result.reasoning}`);
        } else {
            console.log('❌ Book not found by agent.');
            console.log(`Reasoning: ${result.reasoning}`);
        }

    } catch (error) {
        console.error('❌ Agent Crashed:', error);
    }
}

const isbn = process.argv[2] || '9781542016414';
testAgent(isbn);
