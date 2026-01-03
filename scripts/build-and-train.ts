#!/usr/bin/env tsx
/**
 * Build and Train ML Model
 * 
 * Complete workflow to:
 * 1. Export training data from database
 * 2. Optionally scan more books for training data
 * 3. Combine all training data sources
 * 4. Train the classifier model
 * 5. Verify model was created successfully
 * 
 * Usage: tsx scripts/build-and-train.ts [--scan-books N] [--skip-export]
 */

import 'dotenv/config'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import * as path from 'path'

const execAsync = promisify(exec)

interface BuildOptions {
  scanBooks: number // Number of books to scan for additional training data
  skipExport: boolean // Skip exporting from database
  skipScan: boolean // Skip scanning new books
}

async function checkPythonDependencies(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('python3 -c "import sklearn, numpy; print(\'OK\')"')
    return stdout.trim() === 'OK'
  } catch {
    return false
  }
}

async function exportTrainingData(): Promise<void> {
  console.log('\n📤 Step 1: Exporting training data from database...')
  try {
    const { stdout, stderr } = await execAsync('npx tsx scripts/export-training-data.ts')
    if (stdout) console.log(stdout)
    if (stderr && !stderr.includes('warning')) console.error(stderr)
    console.log('✅ Export complete\n')
  } catch (error: any) {
    console.error('⚠️  Export failed (may be no data in database):', error.message)
    if (error.stdout) console.log(error.stdout)
  }
}

async function scanBooksForTraining(count: number): Promise<void> {
  console.log(`\n🔍 Step 2: Scanning ${count} books for additional training data...`)
  console.log('   (This may take several minutes - each book requires API calls)\n')
  
  try {
    const outputFile = path.join(process.cwd(), 'data', 'training', 'scanned_training_data.json')
    const { stdout, stderr } = await execAsync(
      `npx tsx scripts/scan-goodbooks-for-training.ts ${count} "${outputFile}"`
    )
    if (stdout) console.log(stdout)
    if (stderr && !stderr.includes('warning')) console.error(stderr)
    console.log('✅ Scanning complete\n')
  } catch (error: any) {
    console.error('⚠️  Scanning failed:', error.message)
    if (error.stdout) console.log(error.stdout)
    if (error.stderr) console.error(error.stderr)
  }
}

async function combineTrainingData(): Promise<void> {
  console.log('\n🔗 Step 3: Combining training data from all sources...')
  try {
    const { stdout, stderr } = await execAsync('npx tsx scripts/combine-training-data.ts')
    if (stdout) console.log(stdout)
    if (stderr && !stderr.includes('warning')) console.error(stderr)
    console.log('✅ Combination complete\n')
  } catch (error: any) {
    console.error('⚠️  Combination failed:', error.message)
    if (error.stdout) console.log(error.stdout)
  }
}

async function checkTrainingData(): Promise<{ count: number; file: string }> {
  const trainingFile = path.join(process.cwd(), 'data', 'training', 'combined_training_data.json')
  
  try {
    const content = await fs.readFile(trainingFile, 'utf-8')
    const data = JSON.parse(content)
    return { count: Array.isArray(data) ? data.length : 0, file: trainingFile }
  } catch {
    return { count: 0, file: trainingFile }
  }
}

async function trainModel(trainingFile: string): Promise<void> {
  console.log('\n🧪 Step 4: Training classifier model...')
  console.log('   (This may take a few minutes)\n')
  
  const modelFile = path.join(process.cwd(), 'data', 'models', 'content_warning_classifier.pkl')
  
  try {
    const { stdout, stderr } = await execAsync(
      `python3 scripts/train-classifier.py "${trainingFile}" "${modelFile}"`
    )
    if (stdout) console.log(stdout)
    if (stderr && !stderr.includes('warning')) console.error(stderr)
    console.log('✅ Training complete\n')
  } catch (error: any) {
    console.error('❌ Training failed:', error.message)
    if (error.stdout) console.log(error.stdout)
    if (error.stderr) console.error(error.stderr)
    throw error
  }
}

async function verifyModel(): Promise<boolean> {
  const modelFile = path.join(process.cwd(), 'data', 'models', 'content_warning_classifier.pkl')
  
  try {
    const stats = await fs.stat(modelFile)
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
    console.log(`✅ Model verified: ${modelFile}`)
    console.log(`   Size: ${sizeMB} MB`)
    return true
  } catch {
    console.error(`❌ Model file not found: ${modelFile}`)
    return false
  }
}

function parseArgs(): BuildOptions {
  const args = process.argv.slice(2)
  const options: BuildOptions = {
    scanBooks: 0,
    skipExport: false,
    skipScan: false
  }
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--scan-books' && i + 1 < args.length) {
      options.scanBooks = parseInt(args[i + 1], 10) || 0
      i++
    } else if (args[i] === '--skip-export') {
      options.skipExport = true
    } else if (args[i] === '--skip-scan') {
      options.skipScan = true
    }
  }
  
  return options
}

async function main() {
  console.log('🚀 Building and Training ML Model\n')
  console.log('═'.repeat(70))
  
  // Check Python dependencies
  console.log('\n🔍 Checking Python dependencies...')
  const hasDeps = await checkPythonDependencies()
  if (!hasDeps) {
    console.error('❌ Python ML dependencies not installed!')
    console.log('\n📦 Install with:')
    console.log('   pip3 install -r requirements-ml.txt\n')
    process.exit(1)
  }
  console.log('✅ Python dependencies OK\n')
  
  const options = parseArgs()
  
  // Step 1: Export training data
  if (!options.skipExport) {
    await exportTrainingData()
  } else {
    console.log('\n⏭️  Skipping database export (--skip-export)\n')
  }
  
  // Step 2: Scan books for training (optional)
  if (!options.skipScan && options.scanBooks > 0) {
    await scanBooksForTraining(options.scanBooks)
  } else if (!options.skipScan) {
    console.log('\n⏭️  Skipping book scanning (use --scan-books N to enable)\n')
  } else {
    console.log('\n⏭️  Skipping book scanning (--skip-scan)\n')
  }
  
  // Step 3: Combine training data
  await combineTrainingData()
  
  // Step 4: Check training data
  const { count, file } = await checkTrainingData()
  console.log(`\n📊 Training Data Summary:`)
  console.log(`   Examples: ${count}`)
  console.log(`   File: ${file}\n`)
  
  if (count < 10) {
    console.log('⚠️  Warning: Very few training examples!')
    console.log('   Model accuracy will be low.')
    console.log('   Consider:')
    console.log('   1. Scanning more books: --scan-books 50')
    console.log('   2. Exporting from database: Remove --skip-export\n')
  } else if (count < 50) {
    console.log('⚠️  Warning: Few training examples (< 50)')
    console.log('   Model may not perform well.')
    console.log('   Consider scanning more books: --scan-books 50\n')
  }
  
  // Step 5: Train model
  await trainModel(file)
  
  // Step 6: Verify model
  console.log('\n🔍 Step 5: Verifying model...')
  const verified = await verifyModel()
  
  if (verified) {
    console.log('\n✅ Build and Train Complete!')
    console.log('\n📋 Next Steps:')
    console.log('   1. Test model: python3 scripts/test-classifier.py data/models/content_warning_classifier.pkl')
    console.log('   2. Integrate into analysis pipeline')
    console.log('   3. Monitor model performance\n')
  } else {
    console.error('\n❌ Build failed - model not created')
    process.exit(1)
  }
}

main().catch(error => {
  console.error('\n❌ Build failed:', error)
  process.exit(1)
})

