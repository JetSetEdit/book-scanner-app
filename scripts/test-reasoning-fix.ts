/**
 * Test the reasoning fix to ensure it updates AI reasoning to match computed severity
 */

import { buildSeveritySignals, computeSeverityFromSignals } from '../lib/utils/severity-computation'

/**
 * Update reasoning text to match computed severity
 */
function updateReasoningForSeverity(
  originalReasoning: string | undefined,
  computedSeverity: 'mild' | 'moderate' | 'severe',
  signals: { frequency: number; centrality: number; proximity: number; explicitness: number }
): string {
  if (!originalReasoning) {
    const severityText = computedSeverity.charAt(0).toUpperCase() + computedSeverity.slice(1)
    return `${severityText} severity based on computed signals (frequency: ${signals.frequency.toFixed(1)}, centrality: ${signals.centrality.toFixed(1)}, proximity: ${signals.proximity.toFixed(1)}, explicitness: ${signals.explicitness.toFixed(1)}).`
  }

  const severityText = computedSeverity.charAt(0).toUpperCase() + computedSeverity.slice(1)
  
  const severityPatterns = [
    /\b(mild|moderate|severe)\s+severity\s+classification\b/gi,
    /\bjustifying\s+a\s+(mild|moderate|severe)\s+severity\s+classification\b/gi,
    /\b(mild|moderate|severe)\s+severity\s+rating\b/gi,
    /\b(mild|moderate|severe)\s+severity\b/gi,
    /\bclassified\s+as\s+(mild|moderate|severe)\b/gi,
  ]

  let updatedReasoning = originalReasoning
  
  for (const pattern of severityPatterns) {
    updatedReasoning = updatedReasoning.replace(pattern, (match, claimedSeverity) => {
      if (claimedSeverity.toLowerCase() !== computedSeverity.toLowerCase()) {
        return match.replace(claimedSeverity, severityText)
      }
      return match
    })
  }

  if (updatedReasoning === originalReasoning) {
    const hasSeverityMention = /\b(mild|moderate|severe)\b/i.test(originalReasoning)
    
    if (hasSeverityMention) {
      const lastSeverityMatch = originalReasoning.match(/\b(mild|moderate|severe)\b/gi)
      if (lastSeverityMatch && lastSeverityMatch[lastSeverityMatch.length - 1].toLowerCase() !== computedSeverity) {
        const lastIndex = originalReasoning.lastIndexOf(lastSeverityMatch[lastSeverityMatch.length - 1])
        updatedReasoning = 
          originalReasoning.substring(0, lastIndex) + 
          severityText + 
          originalReasoning.substring(lastIndex + lastSeverityMatch[lastSeverityMatch.length - 1].length)
      }
    } else {
      updatedReasoning = `${originalReasoning} This content is classified as ${severityText.toLowerCase()} severity based on computed signals (frequency: ${signals.frequency.toFixed(1)}, centrality: ${signals.centrality.toFixed(1)}, proximity: ${signals.proximity.toFixed(1)}, explicitness: ${signals.explicitness.toFixed(1)}).`
    }
  }

  return updatedReasoning
}

// Test case from "Sharp Objects"
const testCase = {
  subcategory_id: 'death.character_death',
  description: 'Moderate themes of death, including the murder of children.',
  presence: 'on_page' as const,
  detail_level: 'moderate' as const,
  frequency_hint: 'theme' as const,
  centrality_hint: 'central' as const,
  aiReasoning: 'The narrative revolves around the murder of children, which is a central theme. While the description does not provide explicit details, the tone and context suggest moderate detail (emphasis: central, tone: serious, frequency: theme, detail: moderate), justifying a moderate severity classification.'
}

console.log('🧪 Testing Reasoning Fix\n')
console.log('=' .repeat(60))

// Build signals
const signals = buildSeveritySignals({
  presence: testCase.presence,
  detail_level: testCase.detail_level,
  description: testCase.description,
  category_id: testCase.subcategory_id.split('.')[0],
  frequency_hint: testCase.frequency_hint,
  centrality_hint: testCase.centrality_hint
})

// Compute severity
const computedSeverity = computeSeverityFromSignals(signals, undefined)

console.log('\n📝 Original AI Reasoning:')
console.log(`  "${testCase.aiReasoning}"`)

console.log('\n🎯 Computed Severity:', computedSeverity.toUpperCase())

// Update reasoning
const updatedReasoning = updateReasoningForSeverity(
  testCase.aiReasoning,
  computedSeverity,
  signals
)

console.log('\n✅ Updated Reasoning:')
console.log(`  "${updatedReasoning}"`)

console.log('\n🔍 Verification:')
const originalMentionsModerate = testCase.aiReasoning.toLowerCase().includes('moderate severity')
const updatedMentionsSevere = updatedReasoning.toLowerCase().includes('severe severity')
console.log(`  Original mentions "moderate severity": ${originalMentionsModerate ? '✅' : '❌'}`)
console.log(`  Updated mentions "severe severity": ${updatedMentionsSevere ? '✅' : '❌'}`)
console.log(`  Computed severity: ${computedSeverity}`)
console.log(`  Match: ${updatedMentionsSevere && computedSeverity === 'severe' ? '✅ PASS' : '❌ FAIL'}`)

console.log('\n' + '='.repeat(60))
console.log(updatedMentionsSevere && computedSeverity === 'severe' ? '✅ Test PASSED!' : '❌ Test FAILED!')

