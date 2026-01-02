#!/usr/bin/env tsx
/**
 * Combine Multiple Training Data Files
 * 
 * Combines training data from multiple sources into one file.
 */

import * as fs from 'fs/promises'
import * as path from 'path'

async function main() {
  const files = [
    'data/training/backup_training_data.json',
    'data/training/backup2_training_data.json',
    'data/training/exported_training_data.json'
  ]

  const allExamples: any[] = []
  const seen = new Set<string>()

  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf-8')
      const examples = JSON.parse(content)
      
      for (const ex of examples) {
        // Deduplicate by ISBN
        const key = ex.isbn || ex.book_id
        if (!seen.has(key)) {
          seen.add(key)
          allExamples.push(ex)
        }
      }
      
      console.log(`✅ Loaded ${examples.length} from ${file}`)
    } catch (error) {
      console.log(`⚠️  Skipped ${file} (not found or invalid)`)
    }
  }

  const outputFile = 'data/training/combined_training_data.json'
  await fs.writeFile(outputFile, JSON.stringify(allExamples, null, 2))
  
  console.log(`\n✅ Combined ${allExamples.length} unique training examples`)
  console.log(`💾 Saved to: ${outputFile}`)
}

main().catch(console.error)

