/**
 * Verification script to ensure categorical shielding is properly implemented
 * This checks the prompt structure without making API calls
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const agentFile = resolve(process.cwd(), 'lib/content-warning-agent.ts');
const content = readFileSync(agentFile, 'utf-8');

console.log('🔍 Verifying Categorical Shielding Implementation...\n');

// Check 1: Categorical Shielding section exists
const hasCategoricalShielding = content.includes('Categorical Shielding') || 
                                content.includes('CRITICAL: Categorical Shielding');
console.log(`✓ Categorical Shielding section: ${hasCategoricalShielding ? '✅ FOUND' : '❌ MISSING'}`);

// Check 2: Reasoning field has categorical requirements
const hasCategoricalReasoning = content.includes('Categorical explanation for the score') ||
                                content.includes('MUST use clinical, matter-of-fact language');
console.log(`✓ Reasoning field categorical requirements: ${hasCategoricalReasoning ? '✅ FOUND' : '❌ MISSING'}`);

// Check 3: Examples of wrong vs correct reasoning
const hasWrongCorrectExamples = content.includes('WRONG') && content.includes('CORRECT');
console.log(`✓ Wrong vs Correct examples: ${hasWrongCorrectExamples ? '✅ FOUND' : '❌ MISSING'}`);

// Check 4: Prohibition of plot details
const prohibitsPlotDetails = content.includes('DO NOT include specific plot points') ||
                             content.includes('MUST NOT include') ||
                             content.includes('plot-specific information');
console.log(`✓ Prohibition of plot details: ${prohibitsPlotDetails ? '✅ FOUND' : '❌ MISSING'}`);

// Check 5: Input prompts include categorical reminders
const hasInputReminders = content.includes('Categorical Reasoning Enforcement') ||
                         content.includes('categorical taxonomy language');
console.log(`✓ Input prompt reminders: ${hasInputReminders ? '✅ FOUND' : '❌ MISSING'}`);

// Check 6: Final check reminders in agent instructions
const hasFinalCheck = content.includes('FINAL CHECK') || 
                     content.includes('Before submitting, review');
console.log(`✓ Final check reminders: ${hasFinalCheck ? '✅ FOUND' : '❌ MISSING'}`);

// Check 7: Severity ≠ Detail correlation
const hasSeverityGuidance = content.includes('Severity ≠ Narrative Detail') ||
                           content.includes('High severity scores') && content.includes('NOT permission');
console.log(`✓ Severity vs Detail guidance: ${hasSeverityGuidance ? '✅ FOUND' : '❌ MISSING'}`);

// Check 8: Clinical language requirement
const requiresClinical = content.includes('clinical, matter-of-fact') ||
                        content.includes('Clinical Detail Level for Reasoning');
console.log(`✓ Clinical language requirement: ${requiresClinical ? '✅ FOUND' : '❌ MISSING'}`);

console.log('\n📋 Summary:');
const checks = [
  hasCategoricalShielding,
  hasCategoricalReasoning,
  hasWrongCorrectExamples,
  prohibitsPlotDetails,
  hasInputReminders,
  hasFinalCheck,
  hasSeverityGuidance,
  requiresClinical
];

const passed = checks.filter(Boolean).length;
const total = checks.length;

console.log(`\n✅ ${passed}/${total} checks passed`);

if (passed === total) {
  console.log('\n🎉 All categorical shielding mechanisms are properly implemented!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some checks failed. Please review the implementation.');
  process.exit(1);
}
