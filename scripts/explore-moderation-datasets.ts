#!/usr/bin/env tsx
/**
 * Explore Moderation Datasets
 * 
 * Downloads and explores GitHub-hosted moderation datasets to understand
 * their structure and how they map to our taxonomy.
 * 
 * Usage: tsx scripts/explore-moderation-datasets.ts [dataset-name]
 * 
 * Available datasets:
 * - surge-toxicity: Surge AI Toxicity dataset (1,000 examples)
 * - openai-moderation: OpenAI moderation examples
 * - toxigen: Microsoft ToxiGen dataset
 */

import 'dotenv/config'
import * as fs from 'fs/promises'
import * as path from 'path'

interface DatasetInfo {
  name: string
  repo: string
  description: string
  format: 'csv' | 'json' | 'jsonl' | 'tsv'
  url?: string
  mapping: {
    [key: string]: {
      ourCategory: string
      ourSubcategory?: string
      severity?: 'mild' | 'moderate' | 'severe'
      notes?: string
    }
  }
}

const DATASETS: Record<string, DatasetInfo> = {
  'surge-toxicity': {
    name: 'Surge AI Toxicity',
    repo: 'surge-ai/toxicity',
    description: '1,000 English social media comments with binary is_toxic label',
    format: 'json',
    // Note: URL may need to be updated based on actual repo structure
    // Alternative: Download manually from https://github.com/surge-ai/toxicity
    url: undefined, // Will need manual download
    mapping: {
      'is_toxic': {
        ourCategory: 'language',
        ourSubcategory: 'language.strong_language',
        severity: 'moderate',
        notes: 'Binary toxic label - may need severity refinement'
      }
    }
  },
  'openai-moderation': {
    name: 'OpenAI Moderation Examples',
    repo: 'openai/moderation-api-release',
    description: 'Example prompts and category labels aligned with OpenAI moderation taxonomy',
    format: 'json',
    url: 'https://raw.githubusercontent.com/openai/moderation-api-release/main/dataset.json',
    mapping: {
      'hate': {
        ourCategory: 'discrimination',
        severity: 'severe',
        notes: 'Hate speech maps to discrimination'
      },
      'hate/threatening': {
        ourCategory: 'violence',
        ourSubcategory: 'violence.threats',
        severity: 'severe'
      },
      'self-harm': {
        ourCategory: 'mental_health',
        ourSubcategory: 'mental_health.self_harm',
        severity: 'severe'
      },
      'sexual': {
        ourCategory: 'sexual_content',
        severity: 'moderate'
      },
      'sexual/minors': {
        ourCategory: 'sexual_content',
        severity: 'severe',
        notes: 'Content involving minors is severe'
      },
      'violence': {
        ourCategory: 'violence',
        severity: 'moderate'
      },
      'violence/graphic': {
        ourCategory: 'violence',
        ourSubcategory: 'violence.graphic_violence',
        severity: 'severe'
      }
    }
  }
}

async function downloadDataset(datasetName: string): Promise<any> {
  const dataset = DATASETS[datasetName]
  if (!dataset) {
    throw new Error(`Unknown dataset: ${datasetName}. Available: ${Object.keys(DATASETS).join(', ')}`)
  }

  if (!dataset.url) {
    console.log(`⚠️  Dataset ${datasetName} doesn't have a direct download URL`)
    console.log(`   Repository: https://github.com/${dataset.repo}`)
    console.log(`   Please download manually and place in data/datasets/${datasetName}/`)
    return null
  }

  console.log(`📥 Downloading ${dataset.name}...`)
  console.log(`   URL: ${dataset.url}`)

  try {
    const response = await fetch(dataset.url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`✅ Downloaded ${Array.isArray(data) ? data.length : '1'} items`)
    return data
  } catch (error) {
    console.error(`❌ Download failed:`, error)
    return null
  }
}

function analyzeDataset(data: any[], datasetName: string) {
  const dataset = DATASETS[datasetName]
  console.log(`\n📊 Analyzing ${dataset.name}...`)
  console.log(`   Format: ${dataset.format}`)
  console.log(`   Items: ${data.length}`)

  // Show sample items
  console.log(`\n📝 Sample Items (first 3):`)
  data.slice(0, 3).forEach((item, idx) => {
    console.log(`\n   ${idx + 1}.`)
    if (typeof item === 'string') {
      console.log(`      Text: "${item.substring(0, 100)}${item.length > 100 ? '...' : ''}"`)
    } else {
      console.log(`      ${JSON.stringify(item, null, 6).split('\n').slice(0, 10).join('\n      ')}`)
    }
  })

  // Analyze structure
  if (data.length > 0 && typeof data[0] === 'object') {
    console.log(`\n🔍 Dataset Structure:`)
    const keys = Object.keys(data[0])
    keys.forEach(key => {
      const sampleValue = data[0][key]
      const type = typeof sampleValue
      const isArray = Array.isArray(sampleValue)
      console.log(`   - ${key}: ${isArray ? 'array' : type}${isArray ? ` (${sampleValue.length} items)` : ''}`)
    })
  }

  // Show mapping
  console.log(`\n🗺️  Taxonomy Mapping:`)
  Object.entries(dataset.mapping).forEach(([datasetKey, mapping]) => {
    console.log(`   ${datasetKey} → ${mapping.ourCategory}${mapping.ourSubcategory ? `.${mapping.ourSubcategory}` : ''}`)
    if (mapping.severity) {
      console.log(`      Severity: ${mapping.severity}`)
    }
    if (mapping.notes) {
      console.log(`      Note: ${mapping.notes}`)
    }
  })
}

function convertToTrainingExample(item: any, datasetName: string): any {
  const dataset = DATASETS[datasetName]
  
  // Extract text
  let text = ''
  if (typeof item === 'string') {
    text = item
  } else if (item.text) {
    text = item.text
  } else if (item.comment) {
    text = item.comment
  } else if (item.prompt) {
    text = item.prompt
  }

  // Extract labels/categories
  const labels: string[] = []
  if (item.is_toxic) {
    labels.push('toxic')
  }
  if (item.categories) {
    labels.push(...Object.keys(item.categories).filter(k => item.categories[k]))
  }
  if (item.labels) {
    labels.push(...item.labels)
  }

  // Map to our categories
  const warnings: any[] = []
  labels.forEach(label => {
    const mapping = dataset.mapping[label]
    if (mapping) {
      warnings.push({
        category: mapping.ourCategory,
        subcategory: mapping.ourSubcategory || `${mapping.ourCategory}.other`,
        severity: mapping.severity || 'moderate',
        description: `Content flagged as ${label} in moderation dataset`
      })
    }
  })

  // Create synthetic book description
  const bookDescription = `A book containing content that was flagged in moderation datasets: "${text.substring(0, 200)}${text.length > 200 ? '...' : ''}"`

  return {
    book_title: `[Dataset Example] ${datasetName}`,
    book_author: 'Various',
    book_description: bookDescription,
    expected_warnings: warnings,
    source_dataset: datasetName,
    original_text: text.substring(0, 500),
    notes: `Converted from ${dataset.name} moderation dataset`
  }
}

async function main() {
  const datasetName = process.argv[2] || 'surge-toxicity'

  console.log('🔍 Moderation Dataset Explorer\n')
  console.log('─'.repeat(70))

  if (!DATASETS[datasetName]) {
    console.error(`❌ Unknown dataset: ${datasetName}`)
    console.log(`\nAvailable datasets:`)
    Object.entries(DATASETS).forEach(([key, info]) => {
      console.log(`   - ${key}: ${info.name}`)
      console.log(`     ${info.description}`)
    })
    process.exit(1)
  }

  // Download dataset
  const data = await downloadDataset(datasetName)
  if (!data) {
    console.log('\n⚠️  Could not download dataset. Please check the URL or download manually.')
    process.exit(1)
  }

  // Analyze
  const dataArray = Array.isArray(data) ? data : [data]
  analyzeDataset(dataArray, datasetName)

  // Convert sample to training example format
  console.log(`\n🔄 Converting to Training Example Format...`)
  const sample = dataArray[0]
  const example = convertToTrainingExample(sample, datasetName)
  console.log(`\n📋 Converted Example:`)
  console.log(JSON.stringify(example, null, 2))

  // Save sample conversions
  const outputDir = path.join(process.cwd(), 'data', 'datasets', datasetName)
  await fs.mkdir(outputDir, { recursive: true })
  
  const sampleConversions = dataArray.slice(0, 10).map(item => 
    convertToTrainingExample(item, datasetName)
  )
  
  await fs.writeFile(
    path.join(outputDir, 'sample_conversions.json'),
    JSON.stringify(sampleConversions, null, 2)
  )
  
  console.log(`\n💾 Saved ${sampleConversions.length} sample conversions to:`)
  console.log(`   ${path.join(outputDir, 'sample_conversions.json')}`)

  console.log(`\n✅ Exploration complete!`)
  console.log(`\nNext steps:`)
  console.log(`   1. Review sample_conversions.json`)
  console.log(`   2. Adjust mapping in DATASETS constant if needed`)
  console.log(`   3. Run full conversion: tsx scripts/convert-dataset.ts ${datasetName}`)
}

main().catch(console.error)

