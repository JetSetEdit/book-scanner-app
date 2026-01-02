#!/usr/bin/env tsx
/**
 * Test Contextual Understanding
 * 
 * Tests if the AI can distinguish between different contexts for the same content:
 * - Historical vs. contemporary
 * - Condemned vs. endorsed by narrative
 * - Educational vs. exploitative
 * - Quoted/discussed vs. directly depicted
 * 
 * Usage: tsx --env-file=.env.local scripts/test-contextual-understanding.ts
 */

import 'dotenv/config'
import { analyzeBookWithMultiModel } from '../lib/services/multi-model-analysis'

// Test Case 1: Violence in historical/educational context (should be lower impact)
const testCase1 = {
  title: "Historical War Account",
  author: "Test Author",
  isbn: "9780000000001",
  description: `A scholarly examination of World War II, presenting historical accounts of battlefield violence in an educational context. The book includes detailed descriptions of combat scenes from primary source documents, presented analytically to help readers understand the historical period. The narrative explicitly condemns the violence and explores its impact on soldiers and civilians.`
}

// Test Case 2: Violence in contemporary exploitative context (should be higher impact)
const testCase2 = {
  title: "Violent Thriller",
  author: "Test Author",
  isbn: "9780000000002",
  description: `A graphic thriller featuring repeated scenes of brutal violence. The protagonist engages in detailed, gratuitous acts of physical harm against others. The violence is depicted in explicit detail and presented as exciting and justified by the narrative. The story emphasizes and glorifies violent behavior throughout.`
}

// Test Case 3: Sexual content in educational context (should be lower impact)
const testCase3 = {
  title: "Health Education Guide",
  author: "Test Author",
  isbn: "9780000000003",
  description: `An educational guide to sexual health and relationships, written for adults. The book includes clinical descriptions of sexual activity in an educational and analytical context, presented with medical accuracy. The content is designed to inform and educate readers about healthy relationships and consent.`
}

// Test Case 4: Sexual content in exploitative context (should be higher impact)
const testCase4 = {
  title: "Erotic Fiction",
  author: "Test Author",
  isbn: "9780000000004",
  description: `A work of fiction featuring explicit sexual content throughout. The narrative includes detailed, graphic descriptions of sexual activity between consenting adults, presented in a manner that emphasizes and glorifies the sexual encounters. The content is central to the story and presented without educational or analytical context.`
}

async function testContextualUnderstanding() {
  console.log('\n🧪 Testing AI Understanding of Contextual Differences\n')
  console.log('─'.repeat(70))
  console.log('\n📋 Test Cases:')
  console.log('   1. Violence in historical/educational context (condemned)')
  console.log('   2. Violence in contemporary exploitative context (endorsed)')
  console.log('   3. Sexual content in educational context')
  console.log('   4. Sexual content in exploitative context')
  console.log('\n✅ Expected: AI should recognize context and adjust severity accordingly')
  console.log('   - Educational/historical context → lower impact')
  console.log('   - Condemned by narrative → lower impact')
  console.log('   - Exploitative/endorsed → higher impact')
  console.log('\n⏳ Running tests...\n')

  const testCases = [
    { name: 'Historical Violence (Condemned)', data: testCase1, expected: 'lower' },
    { name: 'Exploitative Violence (Endorsed)', data: testCase2, expected: 'higher' },
    { name: 'Educational Sexual Content', data: testCase3, expected: 'lower' },
    { name: 'Exploitative Sexual Content', data: testCase4, expected: 'higher' },
  ]

  const results: Array<{
    name: string
    warnings: any[]
    contextModifiers: string[]
    severityLevels: string[]
    reasoning: string[]
  }> = []

  for (const testCase of testCases) {
    console.log(`\n${'─'.repeat(70)}`)
    console.log(`\n📚 Test: ${testCase.name}`)
    console.log(`   Expected Impact: ${testCase.expected}`)
    console.log(`   Description: ${testCase.data.description.substring(0, 100)}...`)
    console.log('\n⏳ Analyzing...\n')

    try {
      const result = await analyzeBookWithMultiModel(
        testCase.data,
        (message) => {
          // Suppress progress messages for cleaner output
        }
      )

      const warnings = result.warnings
      const contextModifiers = warnings.flatMap(w => w.modifiers || [])
      const severityLevels = warnings.map(w => w.severity)
      const reasoning = warnings.map(w => w.reasoning || '').filter(r => r)

      results.push({
        name: testCase.name,
        warnings,
        contextModifiers,
        severityLevels,
        reasoning
      })

      console.log(`   ✅ Found ${warnings.length} warnings`)
      console.log(`   Severity Levels: ${[...new Set(severityLevels)].join(', ')}`)
      console.log(`   Context Modifiers: ${contextModifiers.length > 0 ? contextModifiers.join(', ') : 'None'}`)

      // Check for context awareness in reasoning
      const contextKeywords = {
        lower: ['educational', 'historical', 'condemned', 'analytical', 'clinical', 'scholarly', 'context'],
        higher: ['exploitative', 'gratuitous', 'endorsed', 'glorified', 'emphasized', 'central']
      }

      const lowerContextFound = contextKeywords.lower.some(keyword => 
        reasoning.some(r => r.toLowerCase().includes(keyword))
      )
      const higherContextFound = contextKeywords.higher.some(keyword => 
        reasoning.some(r => r.toLowerCase().includes(keyword))
      )

      if (testCase.expected === 'lower' && lowerContextFound) {
        console.log(`   ✅ Context recognized: Found educational/historical/condemned indicators`)
      } else if (testCase.expected === 'higher' && higherContextFound) {
        console.log(`   ✅ Context recognized: Found exploitative/endorsed indicators`)
      } else if (testCase.expected === 'lower' && !lowerContextFound) {
        console.log(`   ⚠️  Context not clearly recognized: Expected educational/historical indicators`)
      } else if (testCase.expected === 'higher' && !higherContextFound) {
        console.log(`   ⚠️  Context not clearly recognized: Expected exploitative/endorsed indicators`)
      }

    } catch (error) {
      console.error(`   ❌ Error: ${error}`)
    }
  }

  // Summary Analysis
  console.log('\n' + '─'.repeat(70))
  console.log('\n📊 CONTEXTUAL UNDERSTANDING ANALYSIS\n')

  // Compare severity levels
  const historicalViolence = results.find(r => r.name.includes('Historical'))
  const exploitativeViolence = results.find(r => r.name.includes('Exploitative') && r.name.includes('Violence'))
  const educationalSexual = results.find(r => r.name.includes('Educational'))
  const exploitativeSexual = results.find(r => r.name.includes('Exploitative') && r.name.includes('Sexual'))

  console.log('🔍 Severity Comparison:')
  
  if (historicalViolence && exploitativeViolence) {
    const historicalMax = historicalViolence.severityLevels.includes('severe') ? 'severe' : 
                         historicalViolence.severityLevels.includes('moderate') ? 'moderate' : 'mild'
    const exploitativeMax = exploitativeViolence.severityLevels.includes('severe') ? 'severe' : 
                           exploitativeViolence.severityLevels.includes('moderate') ? 'moderate' : 'mild'
    
    console.log(`   Historical Violence: ${historicalMax}`)
    console.log(`   Exploitative Violence: ${exploitativeMax}`)
    
    if (historicalMax === 'mild' && exploitativeMax === 'severe') {
      console.log(`   ✅ PASS: AI correctly distinguishes context (mild vs severe)`)
    } else if (historicalMax !== exploitativeMax) {
      console.log(`   ⚠️  PARTIAL: AI distinguishes context but severity difference could be clearer`)
    } else {
      console.log(`   ❌ FAIL: AI does not distinguish context (both ${historicalMax})`)
    }
  }

  if (educationalSexual && exploitativeSexual) {
    const educationalMax = educationalSexual.severityLevels.includes('severe') ? 'severe' : 
                           educationalSexual.severityLevels.includes('moderate') ? 'moderate' : 'mild'
    const exploitativeMax = exploitativeSexual.severityLevels.includes('severe') ? 'severe' : 
                           exploitativeSexual.severityLevels.includes('moderate') ? 'moderate' : 'mild'
    
    console.log(`   Educational Sexual: ${educationalMax}`)
    console.log(`   Exploitative Sexual: ${exploitativeMax}`)
    
    if (educationalMax === 'mild' && exploitativeMax === 'severe') {
      console.log(`   ✅ PASS: AI correctly distinguishes context (mild vs severe)`)
    } else if (educationalMax !== exploitativeMax) {
      console.log(`   ⚠️  PARTIAL: AI distinguishes context but severity difference could be clearer`)
    } else {
      console.log(`   ❌ FAIL: AI does not distinguish context (both ${educationalMax})`)
    }
  }

  // Check for context modifiers usage
  console.log('\n🔍 Context Modifier Usage:')
  results.forEach(result => {
    const modifiers = [...new Set(result.contextModifiers)]
    if (modifiers.length > 0) {
      console.log(`   ${result.name}: ${modifiers.join(', ')}`)
    } else {
      console.log(`   ${result.name}: No modifiers applied`)
    }
  })

  // Detailed reasoning analysis
  console.log('\n' + '─'.repeat(70))
  console.log('\n📝 DETAILED REASONING ANALYSIS\n')
  
  results.forEach(result => {
    console.log(`\n${result.name}:`)
    result.warnings.forEach((warning, idx) => {
      console.log(`\n  ${idx + 1}. ${warning.subcategory_id} (${warning.severity})`)
      if (warning.reasoning) {
        console.log(`     Reasoning: ${warning.reasoning.substring(0, 200)}...`)
      }
      if (warning.modifiers && warning.modifiers.length > 0) {
        console.log(`     Modifiers: ${warning.modifiers.join(', ')}`)
      }
    })
  })

  console.log('\n' + '─'.repeat(70))
  console.log('\n✅ Test Complete\n')
}

// Run the test
testContextualUnderstanding().catch(console.error)

