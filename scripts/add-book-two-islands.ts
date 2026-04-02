#!/usr/bin/env tsx
/**
 * One-off: Add "Two Islands" by Ian Kemish (9780702268991) to the database
 * so scans find it when Open Library / Google Books don't have it yet.
 * Run: npx tsx scripts/add-book-two-islands.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

const envPaths = [
  path.join(__dirname, '..', '.env.local'),
  path.join(process.cwd(), '.env.local'),
  '.env.local'
]
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath })
    break
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const ISBN = '9780702268991'
const book = {
  isbn: ISBN,
  title: 'Two Islands',
  author: 'Ian Kemish',
  publisher: 'University of Queensland Press',
  published_date: '2026',
  page_count: 272,
  description:
    'A thriller following Niko, who flees to an isolated Scottish island after witnessing atrocities during the Balkan War in the 1990s. There he meets Slow Fergus, a local recluse, while Australian war crimes investigator Anita Costello races to find him before those who want to silence him. The novel explores how distant conflicts affect remote communities and the personal loyalties characters must navigate. Ian Kemish\'s debut novel draws on his diplomatic work in the Balkans and family connections to Scotland\'s Western Isles.',
  cover_url: null,
  categories: ['Fiction', 'Thriller', 'Literary fiction'],
  last_synced_at: new Date().toISOString(),
}

async function main() {
  const { data: existing } = await supabase.from('books').select('id, title').eq('isbn', ISBN).maybeSingle()
  if (existing) {
    console.log('Book already in database:', existing.title, '(id:', existing.id, ')')
    return
  }

  const { data: inserted, error } = await supabase
    .from('books')
    .insert(book)
    .select('id, title, author, isbn')
    .single()

  if (error) {
    console.error('Insert failed:', error)
    process.exit(1)
  }

  console.log('Added book:', inserted?.title, 'by', inserted?.author, '| ISBN', inserted?.isbn, '| id', inserted?.id)
  console.log('You can now scan ISBN', ISBN, 'and the app will find it and run content-warning analysis.')
}

main()
