import dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env.local or .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config(); // Fallback to .env

import { computeSeverityFromSignals, buildSeveritySignals } from '../lib/utils/severity-computation';
import { getDynamicSeverityScore, refreshSeverityOverrides } from '../lib/config/taxonomy-service';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function runTest() {
  // ... rest of the file
  console.log('🧪 Testing Severity Scoring Logic...\n');

  // 1. Refresh overrides (mocking server startup)
  await refreshSeverityOverrides(true);

  // 2. Define Test Cases
  const cases = [
    { id: 'mental_health.suicidal_ideation', label: 'Suicide (Severe)' },
    { id: 'bullying_or_social_cruelty.bullying', label: 'Bullying (Moderate)' },
    { id: 'sexual_content.sexual_violence', label: 'Sexual Violence (Severe)' },
    { id: 'death_or_grief.grief', label: 'Grief (Moderate)' },
    { id: 'tropes.bully_romance', label: 'Bully Romance (Moderate)' },
  ];

  const scenarios = [
    {
      name: 'Low Evidence',
      data: { presence: 'referenced' as const, detail_level: 'vague' as const, frequency_hint: 'single' as const }
    },
    {
      name: 'High Evidence',
      data: { presence: 'on_page' as const, detail_level: 'graphic' as const, frequency_hint: 'theme' as const }
    }
  ];

  // 3. Run Baseline Test
  console.log('--- Baseline Scores ---');
  for (const c of cases) {
    const [cat, sub] = c.id.split('.');
    const baseline = getDynamicSeverityScore(cat, sub);
    console.log(`\nCategory: ${c.label} (Baseline: ${baseline})`);

    for (const s of scenarios) {
      const signals = buildSeveritySignals({ ...s.data, category_id: cat, description: 'Test description' });
      // Note: signals.explicitness/proximity are calculated by buildSeveritySignals
      const finalScoreLabel = computeSeverityFromSignals(signals, cat, sub);
      
      console.log(`  ${s.name}: ${finalScoreLabel}`);
    }
  }

  // 4. Test Override Behavior
  console.log('\n--- Testing Override: Bully Romance -> 9 (Severe) ---');
  
  // Insert override
  const overrideId = 'tropes.bully_romance';
  const newScore = 9.0;
  
  const { error } = await supabaseAdmin
    .from('taxonomy_severity_overrides')
    .upsert({ subcategory_id: overrideId, severity_score: newScore });

  if (error) {
    console.error('Failed to insert override:', error);
    return;
  }

  // Refresh cache
  await refreshSeverityOverrides(true);

  // Re-test Bully Romance
  const [cat, sub] = overrideId.split('.');
  const baseline = getDynamicSeverityScore(cat, sub);
  console.log(`New Baseline for ${overrideId}: ${baseline}`);
  
  const s = scenarios[1]; // High Evidence
  const signals = buildSeveritySignals({ ...s.data, category_id: cat, description: 'Test description' });
  const finalLabel = computeSeverityFromSignals(signals, cat, sub);
  console.log(`  High Evidence (After Override): ${finalLabel}`);

  // Cleanup
  await supabaseAdmin.from('taxonomy_severity_overrides').delete().eq('subcategory_id', overrideId);
  console.log('\n✅ Test Complete');
}

runTest().catch(console.error);
