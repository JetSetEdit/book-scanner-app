import { generateContentWarnings } from '../lib/content-warning-agent';
import { requiresMediation } from '../lib/config/taxonomy-v2';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local
const envPaths = [
  path.join(process.cwd(), '.env.local'),
  '.env.local'
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

async function runTest() {
  const description = `A YA novel set in a small Australian coastal town.

The protagonist is a First Nations teenager.

Their uncle (also Indigenous) died by suicide years before the story starts; this is revealed gradually through flashbacks and community conversations, not an on‑page scene.

There is on‑page underage binge drinking at parties, some marijuana use, and a near‑fatal overdose for a side character described in moderate detail.

There is a toxic romantic relationship involving gaslighting, controlling behavior, and one instance of implied off‑page sexual coercion (never described explicitly, but strongly implied).

The book contains frequent strong language, a few racist slurs from antagonists, and ongoing bullying at school.

The story is ultimately hopeful and used in some schools as a classroom text.`;

  console.log("📖 Testing Hypothetical Book...");
  console.log("--------------------------------------------------");
  console.log(description);
  console.log("--------------------------------------------------\n");

  console.log("🤖 Asking Agent (Mode: Evidence-Based)...");
  
  const startTime = performance.now();
  const result = await generateContentWarnings({
    book_title: "Hypothetical YA Novel",
    book_author: "Test Author",
    book_description: description
  }, "gpt-4o", "new");
  const endTime = performance.now();

  console.log(`\n✅ Analysis Complete in ${(endTime - startTime).toFixed(0)}ms\n`);

  console.log("⚠️  Content Warnings Generated:");
  console.log(`Total: ${result.content_warnings.length} warnings\n`);
  
  result.content_warnings.forEach((w, i) => {
    console.log(`${i + 1}. [${w.severity.toUpperCase()}] ${w.category}${w.subcategory_id ? ` -> ${w.subcategory_id}` : ''}`);
    console.log(`   Score: ${w.score.toFixed(2)}`);
    console.log(`   Presence: ${w.presence || 'on_page'}`);
    console.log(`   Detail: ${w.detail_level || 'N/A'}`);
    console.log(`   Description: ${w.description}`);
    console.log(`   Reasoning: ${w.reasoning.substring(0, 200)}...`);
    console.log('');
  });

  // Check for indigenous context in raw output
  const rawOutput = (result as any).raw_output;
  const indigenousContext = rawOutput?.indigenous_context;
  
  if (indigenousContext) {
    console.log("\n🇦🇺 Indigenous Context Flags:");
    console.log(`   Has Indigenous Content: ${indigenousContext.has_indigenous_content}`);
    console.log(`   Has Deceased Persons: ${indigenousContext.has_deceased_persons}`);
  } else {
    console.log("\n🇦🇺 Indigenous Context: Not detected in output");
  }

  // Calculate mediation
  const mediation = requiresMediation(
    result.content_warnings.map(w => ({
      category_id: w.category,
      severity: w.severity,
      detail_level: w.detail_level
    })),
    {
      hasIndigenousContent: indigenousContext?.has_indigenous_content || false,
      hasDeceasedPersons: indigenousContext?.has_deceased_persons || false
    }
  );

  console.log(`\n🛑 Mediation Required: ${mediation.required ? "YES ✅" : "NO"}`);
  if (mediation.required) {
    console.log(`   Reasons: ${mediation.reasons.join(", ")}`);
  }

  console.log(`\n📊 Classification Rating: ${result.classification_rating || 'Not assigned'}`);
  console.log(`📈 Confidence: ${result.confidence}`);
}

runTest().catch(console.error);
