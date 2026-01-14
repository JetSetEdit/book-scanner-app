import dotenv from 'dotenv';
import path from 'path';

// Explicitly load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

import { computeSeverityFromSignals, buildSeveritySignals, calculateEvidenceScore } from '../lib/utils/severity-computation';
import { getDynamicSeverityScore, refreshSeverityOverrides } from '../lib/config/taxonomy-service';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function runVerification() {
  // 1. Refresh overrides (mocking server startup)
  await refreshSeverityOverrides(true);

  // 2. Define Test Cases
  const cases = [
    'mental_health.suicidal_ideation',
    'sexual_content.sexual_violence',
    'violence.infanticide_or_intentional_child_harm',
    'tropes.bully_romance',
    'bullying_or_social_cruelty.bullying'
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

  console.log('--- Severity Verification Log ---');

  for (const fullId of cases) {
    const [cat, sub] = fullId.split('.');
    
    // Baseline
    const baselineScore = getDynamicSeverityScore(cat, sub);
    
    for (const s of scenarios) {
      const signals = buildSeveritySignals({ ...s.data, category_id: cat, description: 'Test description' });
      
      const evidenceScore = calculateEvidenceScore(signals);
      
      // Calculate final score using the formula manually for logging, since computeSeverityFromSignals only returns label
      // But wait, user wants the "finalScore" which is internal variable.
      // I can replicate the logic here or modify the function.
      // Replicating logic for display purposes:
      
      const normalizedBaseline = baselineScore / 10.0;
      const evidenceMultiplier = 0.6 + (evidenceScore * 0.4);
      let finalScore = normalizedBaseline * evidenceMultiplier;
      
      // Floors
       const severeTopics = [
        'sexual_content.sexual_violence',
        'mental_health.suicidal_ideation',
        'violence.infanticide_or_intentional_child_harm',
        'violence.torture',
        'violence.human_trafficking'
      ];
      
      if (severeTopics.includes(fullId) && finalScore < 0.5) {
        finalScore = 0.55; 
      }
      
      const label = computeSeverityFromSignals(signals, cat, sub);

      console.log(`\nID: ${fullId} (${s.name})`);
      console.log(`  Baseline Score: ${baselineScore}`);
      console.log(`  Evidence Score: ${evidenceScore.toFixed(3)}`);
      console.log(`  Final Score:    ${finalScore.toFixed(3)}`);
      console.log(`  Label:          ${label}`);
    }
  }
}

runVerification().catch(console.error);
