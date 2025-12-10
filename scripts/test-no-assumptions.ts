import fs from 'fs';
import path from 'path';
import { generateContentWarnings } from '../lib/content-warning-agent'

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.+)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    });
}

// Test the problematic book that was making assumptions
const testBook = {
  book_title: "Untitled TBC 202325",
  book_author: "Harper Lee",
  book_description: "Harper Lee remains a landmark figure in the American canon - thanks to Scout, Jem, Atticus, and the other indelible characters in her Pulitzer-winning debut, To Kill a Mockingbird; as well as for the darker, late-'50s version of small-town Alabama that emerged in Go Set a Watchman, her only other novel, published in 2015 after its rediscovery. Less remembered, until now, however, is Harper Lee the dogged young writer, who crafted stories in hopes of magazine publication; Lee the lively New Yorker, Alabamian, and friend to Truman Capote; and the Lee who peppered the pages of McCall's and Vogue with thoughtful essays in the latter part of the twentieth century. The Land of Sweet Forever combines Lee's early short fiction and later nonfiction in a volume offering an unprecedented look at the development of her inimitable voice. Covering territory from the Alabama schoolyards of Lee's youth to the luncheonettes and movie houses of midcentury Manhattan, The Land of Sweet Forever invites still-vital conversations about politics, equality, travel, love, fiction, art, the American South, and what it means to lead an engaged and creative life. This collection comes with an introduction by Casey Cep, Harper Lee's appointed biographer, which provides illuminating background for our reading of these stories and connects them both to Lee's life and to her two novels.",
  book_categories: ["Fiction"],
  book_isbn: "9781529155419"
}

async function test() {
  console.log('🧪 Testing content warning generation...')
  console.log(`Book: "${testBook.book_title}" by ${testBook.book_author}`)
  console.log(`Description length: ${testBook.book_description.length} characters\n`)

  const result = await generateContentWarnings(testBook)

  console.log('\n📊 Results:')
  console.log(`Confidence: ${result.confidence}`)
  console.log(`Warnings generated: ${result.content_warnings.length}`)
  console.log(`Reasoning: ${result.reasoning}\n`)

  if (result.content_warnings.length > 0) {
    console.log('⚠️  Warnings:')
    result.content_warnings.forEach((w, i) => {
      console.log(`\n${i + 1}. ${w.category_id}${w.subcategory_id ? ` > ${w.subcategory_id}` : ''} (${w.severity})`)
      console.log(`   Description: ${w.description}`)
      console.log(`   Reasoning: ${w.reasoning}`)
      console.log(`   Score: ${w.score}`)
    })
  } else {
    console.log('✅ No warnings generated (as expected for a collection of essays/short stories)')
  }

  // Check if reasoning mentions author's other works (bad)
  const reasoningLower = result.reasoning.toLowerCase()
  const hasAssumptions = 
    reasoningLower.includes("harper lee's known") ||
    reasoningLower.includes("consistent with") ||
    reasoningLower.includes("author's other") ||
    reasoningLower.includes("typical themes")

  if (hasAssumptions) {
    console.log('\n❌ PROBLEM: Reasoning still contains assumptions about author/other works!')
  } else {
    console.log('\n✅ GOOD: No assumptions detected in reasoning')
  }
}

test().catch(console.error)

