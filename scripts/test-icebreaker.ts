import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

// Import the web search function
import { performWebSearch } from '../lib/content-warning-agent';

async function testIcebreaker() {
    console.log('🧪 Testing if we can find Icebreaker content warnings...\n');
    
    // Test different query formats
    const queries = [
        'Icebreaker by Hannah Grace',
        'Icebreaker Hannah Grace content warnings',
        '9780349433883', // Icebreaker ISBN (if known)
        'Icebreaker hannah grace',
    ];

    for (const query of queries) {
        console.log(`\n📝 Testing query: "${query}"`);
        console.log('─'.repeat(50));
        
        try {
            const result = await performWebSearch({ query });
            
            if (result.error) {
                console.log(`❌ Error: ${result.error}`);
                continue;
            }
            
            if (!result.results || result.results === 'No results found.') {
                console.log('❌ No results found');
                continue;
            }
            
            // Parse results
            const sections = result.results.split('\n\n---\n\n');
            console.log(`✅ Found ${sections.length} result sections\n`);
            
            // Look for author site results
            let foundAuthorSite = false;
            let foundScraping = false;
            
            sections.forEach((section, index) => {
                if (section.includes('Source: Direct Author Site Scrape')) {
                    foundScraping = true;
                    console.log(`\n🎯 SCRAPING RESULT (Section ${index + 1}):`);
                    console.log(section);
                } else if (section.includes('Source: Official/Author Search') || section.includes('Source: Author Site Search')) {
                    foundAuthorSite = true;
                    console.log(`\n🔍 AUTHOR SEARCH RESULT (Section ${index + 1}):`);
                    console.log(section.substring(0, 300) + '...');
                }
            });
            
            if (!foundScraping && !foundAuthorSite) {
                console.log('⚠️  No author site results found in this query');
                console.log('First 200 chars of results:');
                console.log(result.results.substring(0, 200) + '...');
            }
            
        } catch (error) {
            console.error(`❌ Test failed:`, error);
        }
    }
    
    console.log('\n\n📊 Summary:');
    console.log('─'.repeat(50));
    console.log('The scraping function would:');
    console.log('1. Check if query includes "hannah grace"');
    console.log('2. Fetch https://www.hannahgrace.co.uk/books');
    console.log('3. Check if HTML contains "icebreaker"');
    console.log('4. Return confirmation (but NOT the actual warnings)');
    console.log('\n⚠️  IMPORTANT: Even if scraping finds the author site,');
    console.log('   it does NOT extract the actual content warnings.');
    console.log('   It only confirms the book exists on the author site.');
}

testIcebreaker();

