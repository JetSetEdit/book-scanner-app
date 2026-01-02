import { calculateSeverityScore } from '../lib/utils/severity-scoring'

// Based on author-provided warnings for Icebreaker by Hannah Grace
// From training examples - these are the official author warnings

const icebreakerWarnings = [
  // Mental Health - Disordered eating, anxiety and stress
  {
    severity: 'moderate' as const,
    category_id: 'mental_health',
    category: 'mental_health'
  },
  
  // Sexual Content - Consensual sexual content
  {
    severity: 'moderate' as const,
    category_id: 'sexual_content',
    category: 'sexual_content'
  },
  
  // Violence - Near death experience
  {
    severity: 'moderate' as const,
    category_id: 'violence',
    category: 'violence'
  },
  
  // Death/Grief - Death of parent (past event, only discussed)
  {
    severity: 'mild' as const,
    category_id: 'death_or_grief',
    category: 'death_or_grief'
  },
  
  // Emotional Abuse - Toxic friendships
  {
    severity: 'mild' as const,
    category_id: 'emotional_abuse_or_toxic_relationships',
    category: 'emotional_abuse_or_toxic_relationships'
  },
  
  // Other - Cheating (past event, discussed, not involving main characters)
  {
    severity: 'mild' as const,
    category_id: 'other',
    category: 'other'
  },
  
  // Substance Use - Alcohol use
  {
    severity: 'mild' as const,
    category_id: 'substance_use_or_alcohol',
    category: 'substance_use_or_alcohol'
  },
  
  // Language - Explicit language
  {
    severity: 'mild' as const,
    category_id: 'language',
    category: 'language'
  }
]

const score = calculateSeverityScore(icebreakerWarnings)

console.log('📚 ICEBREAKER - Manual Analysis Based on Author-Provided Warnings')
console.log('='.repeat(80))
console.log('\nBased on Hannah Grace\'s official content warnings:')
console.log(`\nTotal Warnings: ${icebreakerWarnings.length}`)
console.log(`  - Moderate: ${icebreakerWarnings.filter(w => w.severity === 'moderate').length}`)
console.log(`  - Mild: ${icebreakerWarnings.filter(w => w.severity === 'mild').length}`)
console.log(`  - Severe: ${icebreakerWarnings.filter(w => w.severity === 'severe').length}`)

console.log('\n📊 Severity Score Calculation:')
console.log(`  Final Score: ${score.toFixed(1)}`)

console.log('\n📋 Warning Breakdown:')
console.log('  1. Mental Health (moderate) - Disordered eating, anxiety, stress')
console.log('  2. Sexual Content (moderate) - Consensual sexual content')
console.log('  3. Violence (moderate) - Near death experience')
console.log('  4. Death/Grief (mild) - Death of parent (past, discussed)')
console.log('  5. Toxic Relationships (mild) - Toxic friendships')
console.log('  6. Other (mild) - Cheating (past, discussed)')
console.log('  7. Substance Use (mild) - Alcohol use')
console.log('  8. Language (mild) - Explicit language')

console.log('\n🎯 Expected Classification: M (Moderate)')
console.log('   - Highest severity: Moderate (no severe warnings)')
console.log('   - Multiple moderate warnings in sensitive categories')
console.log('   - Should rank BELOW books with severe warnings')

console.log('\n⚠️  Current Database Score: 133.2')
console.log('   This suggests 2 SEVERE warnings exist in the database')
console.log('   But author-provided warnings show NO severe warnings')
console.log('   → Likely misclassification or duplicate warnings')

