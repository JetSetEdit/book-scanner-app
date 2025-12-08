#!/usr/bin/env tsx

/**
 * Migration Script: Map existing content warnings to subcategories
 * 
 * Uses a hybrid approach:
 * 1. Deterministic mapping for exact/pattern matches (80% of cases)
 * 2. AI analysis for fuzzy cases (20% of cases)
 * 
 * This script can be run multiple times safely (idempotent).
 */

import fs from "fs"
import path from "path"
import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/supabase"
import { 
  WARNING_CATEGORIES, 
  getCategoryById, 
  validateSubcategoryParent,
  getValidSubcategoriesForCategory 
} from "@/lib/config/taxonomy-v2"

// Load environment variables
const envPath = path.resolve(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8")
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.+)$/)
    if (match) {
      const key = match[1].trim()
      let value = match[2].trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      process.env[key] = value
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient<Database>(supabaseUrl, supabaseKey)

/**
 * Deterministic mapping rules for common patterns
 * Returns subcategory_id if match found, null otherwise
 */
function mapToSubcategoryDeterministic(
  categoryId: string | null,
  description: string
): string | null {
  if (!categoryId) return null

  const lowerDesc = description.toLowerCase()

  // Mental Health mappings
  if (categoryId === 'mental_health') {
    if (lowerDesc.includes('disordered eating') || lowerDesc.includes('eating disorder') || lowerDesc.includes('body image')) {
      return 'disordered_eating'
    }
    if (lowerDesc.includes('anxiety') || lowerDesc.includes('panic') || lowerDesc.includes('stress')) {
      return 'anxiety'
    }
    if (lowerDesc.includes('depression') || lowerDesc.includes('depressive')) {
      return 'depression'
    }
    if (lowerDesc.includes('ptsd') || lowerDesc.includes('trauma') || lowerDesc.includes('traumatic')) {
      return 'ptsd'
    }
    if (lowerDesc.includes('self-harm') || lowerDesc.includes('self harm') || lowerDesc.includes('cutting')) {
      return 'self_harm'
    }
    if (lowerDesc.includes('suicide') || lowerDesc.includes('suicidal')) {
      return 'suicidal_ideation'
    }
    return 'other_mental_health'
  }

  // Emotional Abuse / Toxic Relationships mappings
  if (categoryId === 'emotional_abuse_or_toxic_relationships') {
    if (lowerDesc.includes('gaslight') || lowerDesc.includes('psychological manipulation')) {
      return 'gaslighting'
    }
    if (lowerDesc.includes('manipulat') || lowerDesc.includes('coercive')) {
      return 'manipulation'
    }
    if (lowerDesc.includes('controlling') || lowerDesc.includes('possessive') || lowerDesc.includes('isolation')) {
      return 'controlling_behavior'
    }
    if (lowerDesc.includes('toxic friendship') || lowerDesc.includes('unhealthy social')) {
      return 'toxic_friendships'
    }
    if (lowerDesc.includes('cheat') || lowerDesc.includes('infidelity') || lowerDesc.includes('betrayal')) {
      return 'cheating'
    }
    if (lowerDesc.includes('emotional abuse') || lowerDesc.includes('verbal abuse')) {
      return 'emotional_abuse'
    }
    return 'other_toxic_relationships'
  }

  // Violence mappings
  if (categoryId === 'violence') {
    if (lowerDesc.includes('graphic') || lowerDesc.includes('gore') || lowerDesc.includes('blood')) {
      return 'graphic_violence'
    }
    if (lowerDesc.includes('weapon') || lowerDesc.includes('gun') || lowerDesc.includes('knife')) {
      return 'weapons'
    }
    if (lowerDesc.includes('war') || lowerDesc.includes('battle') || lowerDesc.includes('military')) {
      return 'war'
    }
    if (lowerDesc.includes('domestic violence') || lowerDesc.includes('intimate partner')) {
      return 'domestic_violence'
    }
    if (lowerDesc.includes('torture') || lowerDesc.includes('prolonged suffering')) {
      return 'torture'
    }
    if (lowerDesc.includes('kidnap') || lowerDesc.includes('abduction') || lowerDesc.includes('confinement') || lowerDesc.includes('captivity')) {
      return 'kidnapping_confinement'
    }
    return 'other_violence'
  }

  // Death / Grief mappings
  if (categoryId === 'death_or_grief') {
    if (lowerDesc.includes('character death') || lowerDesc.includes('on-page death') || lowerDesc.includes('death scene')) {
      return 'character_death'
    }
    if (lowerDesc.includes('terminal') || lowerDesc.includes('dying') || lowerDesc.includes('end-of-life')) {
      return 'terminal_illness'
    }
    if (lowerDesc.includes('grief') || lowerDesc.includes('mourning') || lowerDesc.includes('bereavement')) {
      return 'grief'
    }
    if (lowerDesc.includes('funeral') || lowerDesc.includes('memorial')) {
      return 'funeral_scenes'
    }
    if (lowerDesc.includes('near death') || lowerDesc.includes('life-threatening')) {
      return 'near_death'
    }
    if (lowerDesc.includes('past death') || lowerDesc.includes('historical death') || lowerDesc.includes('discussed but not shown')) {
      return 'past_death'
    }
    if (lowerDesc.includes('pregnancy') || lowerDesc.includes('miscarriage') || lowerDesc.includes('stillbirth') || lowerDesc.includes('abortion')) {
      return 'pregnancy_miscarriage'
    }
    return 'other_death_grief'
  }

  // Sexual Content mappings
  if (categoryId === 'sexual_content') {
    if (lowerDesc.includes('explicit') || lowerDesc.includes('graphic')) {
      return 'explicit_sexual_content'
    }
    if (lowerDesc.includes('sexual assault') || lowerDesc.includes('rape') || lowerDesc.includes('non-consensual')) {
      return 'sexual_violence'
    }
    if (lowerDesc.includes('romance') || lowerDesc.includes('steamy') || lowerDesc.includes('spice')) {
      return 'intense_romance'
    }
    return 'sexual_themes'
  }

  // Substance Use mappings
  if (categoryId === 'substance_use_or_alcohol') {
    if (lowerDesc.includes('alcohol') || lowerDesc.includes('drinking')) {
      return 'alcohol'
    }
    if (lowerDesc.includes('drug') && !lowerDesc.includes('overdose')) {
      return 'drug_use'
    }
    if (lowerDesc.includes('addiction') || lowerDesc.includes('dependence')) {
      return 'addiction'
    }
    if (lowerDesc.includes('overdose') || lowerDesc.includes('poisoning')) {
      return 'overdose'
    }
    return 'other_substance_use'
  }

  // Discrimination mappings
  if (categoryId === 'discrimination') {
    if (lowerDesc.includes('racism') || lowerDesc.includes('racial')) {
      return 'racism'
    }
    if (lowerDesc.includes('sexism') || lowerDesc.includes('misogyny') || lowerDesc.includes('misandry')) {
      return 'sexism'
    }
    if (lowerDesc.includes('homophobia') || lowerDesc.includes('anti-lgbtq')) {
      return 'homophobia'
    }
    if (lowerDesc.includes('transphobia') || lowerDesc.includes('anti-trans')) {
      return 'transphobia'
    }
    if (lowerDesc.includes('religious') || lowerDesc.includes('religious intolerance')) {
      return 'religious_discrimination'
    }
    if (lowerDesc.includes('ableism') || lowerDesc.includes('disability')) {
      return 'ableism'
    }
    return 'other_discrimination'
  }

  // Language mappings
  if (categoryId === 'language') {
    if (lowerDesc.includes('slur') || lowerDesc.includes('hate speech')) {
      return 'slurs'
    }
    if (lowerDesc.includes('profanity') || lowerDesc.includes('swearing') || lowerDesc.includes('strong language')) {
      return 'strong_language'
    }
    return 'other_language'
  }

  // Other category - use the "other" subcategory
  if (categoryId === 'other') {
    return 'other'
  }

  return null
}

async function migrateWarningsToSubcategories() {
  console.log("🔄 Migrating existing warnings to subcategories...\n")

  // Get all warnings without subcategory_id
  const { data: warnings, error: fetchError } = await supabase
    .from("content_warnings")
    .select("id, book_id, category_id, category, description, severity")
    .is("subcategory_id", null)
    .order("created_at", { ascending: true })

  if (fetchError) {
    console.error("❌ Error fetching warnings:", fetchError)
    process.exit(1)
  }

  if (!warnings || warnings.length === 0) {
    console.log("✅ No warnings found that need migration.\n")
    return
  }

  console.log(`📊 Found ${warnings.length} warnings to migrate\n`)

  let deterministicMapped = 0
  let skipped = 0
  let errors = 0
  const needsAI: any[] = []

  // Phase 1: Deterministic mapping
  console.log("Phase 1: Deterministic mapping...")
  for (const warning of warnings) {
    const categoryId = warning.category_id || warning.category
    if (!categoryId) {
      console.log(`⚠️  Warning ${warning.id} has no category_id or category, skipping`)
      skipped++
      continue
    }

    const subcategoryId = mapToSubcategoryDeterministic(categoryId, warning.description || "")

    if (subcategoryId) {
      // Validate the mapping
      if (!validateSubcategoryParent(categoryId, subcategoryId)) {
        console.log(`⚠️  Invalid mapping for warning ${warning.id}: ${categoryId} -> ${subcategoryId}`)
        needsAI.push(warning)
        continue
      }

      // Update the warning
      const { error: updateError } = await supabase
        .from("content_warnings")
        .update({ subcategory_id: subcategoryId })
        .eq("id", warning.id)

      if (updateError) {
        console.error(`❌ Error updating warning ${warning.id}:`, updateError)
        errors++
      } else {
        deterministicMapped++
        if (deterministicMapped % 10 === 0) {
          process.stdout.write(".")
        }
      }
    } else {
      // No deterministic match - needs AI analysis
      needsAI.push(warning)
    }
  }

  console.log(`\n✅ Deterministic mapping complete:`)
  console.log(`   Mapped: ${deterministicMapped}`)
  console.log(`   Needs AI: ${needsAI.length}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Errors: ${errors}\n`)

  // Phase 2: AI mapping (if needed)
  if (needsAI.length > 0) {
    console.log(`Phase 2: AI mapping for ${needsAI.length} warnings...`)
    console.log("⚠️  Note: AI mapping not implemented yet. These warnings will need manual review.")
    console.log("\nWarnings needing AI/manual mapping:")
    for (const warning of needsAI.slice(0, 20)) { // Show first 20
      console.log(`   • ${warning.id}: "${warning.description?.substring(0, 60)}..." (category: ${warning.category_id || warning.category})`)
    }
    if (needsAI.length > 20) {
      console.log(`   ... and ${needsAI.length - 20} more`)
    }
  }

  console.log("\n✅ Migration complete!")
  console.log(`\nSummary:`)
  console.log(`   Total warnings: ${warnings.length}`)
  console.log(`   Deterministically mapped: ${deterministicMapped}`)
  console.log(`   Needs AI/manual review: ${needsAI.length}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Errors: ${errors}`)
}

// Run the migration
migrateWarningsToSubcategories()
  .then(() => {
    console.log("\n✅ Migration script complete!")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Error:", error)
    process.exit(1)
  })

