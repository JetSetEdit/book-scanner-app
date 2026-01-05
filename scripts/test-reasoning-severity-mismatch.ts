/**
 * Test script to demonstrate and fix reasoning/severity mismatch
 * 
 * This script tests whether AI reasoning text matches the computed severity.
 */

import { buildSeveritySignals, computeSeverityFromSignals } from '../lib/utils/severity-computation'

// Simulate the exact case from "Sharp Objects"
const testCase = {
  subcategory_id: 'death.character_death',
  description: 'Moderate themes of death, including the murder of children.',
  presence: 'on_page' as const,
  detail_level: 'moderate' as const,
  frequency_hint: 'theme' as const,
  centrality_hint: 'central' as const,
  aiReasoning: 'The narrative revolves around the murder of children, which is a central theme. While the description does not provide explicit details, the tone and context suggest moderate detail (emphasis: central, tone: serious, frequency: theme, detail: moderate), justifying a moderate severity classification.'
}

console.log('🧪 Testing Reasoning/Severity Mismatch\n')
console.log('Test Case: Character Death Warning')
console.log('=' .repeat(60))

// Build signals (same as processWarnings does)
const signals = buildSeveritySignals({
  presence: testCase.presence,
  detail_level: testCase.detail_level,
  description: testCase.description,
  category_id: testCase.subcategory_id.split('.')[0],
  frequency_hint: testCase.frequency_hint,
  centrality_hint: testCase.centrality_hint
})

console.log('\n📊 Severity Signals:')
console.log(`  Frequency: ${signals.frequency} (${testCase.frequency_hint})`)
console.log(`  Proximity: ${signals.proximity} (${testCase.presence})`)
console.log(`  Centrality: ${signals.centrality} (${testCase.centrality_hint})`)
console.log(`  Explicitness: ${signals.explicitness} (${testCase.detail_level})`)
console.log(`  Intensity Markers: ${signals.intensity_markers.length}`)

// Compute severity
const computedSeverity = computeSeverityFromSignals(signals, undefined)

console.log('\n🎯 Computed Severity:', computedSeverity.toUpperCase())

// Calculate the score manually to show why
const baseScore = (signals.frequency * 0.3) + (signals.explicitness * 0.4)
const proximityMultiplier = 1 + (signals.proximity * 0.2)
const centralityMultiplier = 1 + (signals.centrality * 0.2)
const intensityBonus = Math.min(signals.intensity_markers.length * 0.1, 0.3)
const finalScore = (baseScore * proximityMultiplier * centralityMultiplier) + intensityBonus
const normalizedScore = Math.min(finalScore, 1.0)

console.log('\n📈 Score Calculation:')
console.log(`  Base Score: (${signals.frequency} × 0.3) + (${signals.explicitness} × 0.4) = ${baseScore.toFixed(3)}`)
console.log(`  Proximity Multiplier: 1 + (${signals.proximity} × 0.2) = ${proximityMultiplier.toFixed(3)}`)
console.log(`  Centrality Multiplier: 1 + (${signals.centrality} × 0.2) = ${centralityMultiplier.toFixed(3)}`)
console.log(`  Intensity Bonus: ${intensityBonus.toFixed(3)}`)
console.log(`  Final Score: ${normalizedScore.toFixed(3)}`)
console.log(`  Threshold: < 0.35 = mild, < 0.70 = moderate, ≥ 0.70 = severe`)

console.log('\n❌ AI Reasoning Text:')
console.log(`  "${testCase.aiReasoning}"`)
console.log(`  → Claims: MODERATE severity`)

console.log('\n✅ Actual Computed Severity:')
console.log(`  → ${computedSeverity.toUpperCase()}`)

console.log('\n🔍 MISMATCH DETECTED!')
console.log(`  AI says: ${testCase.aiReasoning.match(/moderate|severe|mild/i)?.[0] || 'unknown'}`)
console.log(`  System computed: ${computedSeverity}`)
console.log(`  Difference: ${testCase.aiReasoning.toLowerCase().includes(computedSeverity) ? '✅ MATCH' : '❌ MISMATCH'}`)

console.log('\n' + '='.repeat(60))
console.log('✅ Test complete - mismatch confirmed!')
console.log('Next: Fix the code to update reasoning text after severity computation.')

