#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local manually
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const lines = envContent.split('\n')
    
    lines.forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '')
        process.env[key.trim()] = value.trim()
      }
    })
  }
}

loadEnvFile()

// You'll need to set these environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  console.error('\n💡 Make sure you have a .env.local file with these values')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const dummyBook = {
  isbn: '9781234567890',
  title: 'The Adventures of Test Book',
  author: 'Jane Developer',
  cover_url: 'https://via.placeholder.com/300x450/4F46E5/FFFFFF?text=Test+Book',
  description: 'A thrilling adventure story about a developer who discovers a magical codebase that can generate content warnings. Contains themes of discovery, friendship, and the occasional debugging session that goes on too long.',
  publisher: 'Dev Publishing House',
  published_date: '2024-01-15',
  page_count: 350,
  categories: ['Fiction', 'Adventure', 'Technology', 'Fantasy']
}

const sampleContentWarnings = [
  {
    category: 'violence',
    description: 'Contains scenes of epic debugging battles and the occasional code conflict',
    severity: 'mild',
    user_id: null,
    helpful_count: 5,
    not_helpful_count: 1
  },
  {
    category: 'mental_health',
    description: 'Addresses themes of imposter syndrome and the stress of debugging complex systems',
    severity: 'moderate',
    user_id: null,
    helpful_count: 8,
    not_helpful_count: 0
  },
  {
    category: 'other',
    description: 'Contains technical jargon and programming concepts that may be confusing to non-developers',
    severity: 'mild',
    user_id: null,
    helpful_count: 12,
    not_helpful_count: 2
  }
]

async function createDummyBook() {
  try {
    console.log('🚀 Creating dummy book for local development...')
    
    // Check if book already exists
    const { data: existingBook } = await supabase
      .from('books')
      .select('id')
      .eq('isbn', dummyBook.isbn)
      .single()
    
    if (existingBook) {
      console.log('📚 Book already exists, updating...')
      
      // Update existing book
      const { error: updateError } = await supabase
        .from('books')
        .update(dummyBook)
        .eq('id', existingBook.id)
      
      if (updateError) {
        console.error('❌ Error updating book:', updateError)
        return
      }
      
      console.log('✅ Book updated successfully!')
      
      // Clear existing content warnings
      const { error: deleteError } = await supabase
        .from('content_warnings')
        .delete()
        .eq('book_id', existingBook.id)
      
      if (deleteError) {
        console.error('❌ Error clearing existing warnings:', deleteError)
        return
      }
      
      // Insert new content warnings
      const warningsToInsert = sampleContentWarnings.map(warning => ({
        ...warning,
        book_id: existingBook.id
      }))
      
      const { error: insertWarningsError } = await supabase
        .from('content_warnings')
        .insert(warningsToInsert)
      
      if (insertWarningsError) {
        console.error('❌ Error inserting content warnings:', insertWarningsError)
        return
      }
      
      console.log('✅ Content warnings updated successfully!')
      console.log(`📖 Book ID: ${existingBook.id}`)
      
    } else {
      console.log('📚 Creating new book...')
      
      // Insert new book
      const { data: newBook, error: insertError } = await supabase
        .from('books')
        .insert(dummyBook)
        .select()
        .single()
      
      if (insertError) {
        console.error('❌ Error creating book:', insertError)
        return
      }
      
      console.log('✅ Book created successfully!')
      
      // Insert content warnings
      const warningsToInsert = sampleContentWarnings.map(warning => ({
        ...warning,
        book_id: newBook.id
      }))
      
      const { error: insertWarningsError } = await supabase
        .from('content_warnings')
        .insert(warningsToInsert)
      
      if (insertWarningsError) {
        console.error('❌ Error inserting content warnings:', insertWarningsError)
        return
      }
      
      console.log('✅ Content warnings created successfully!')
      console.log(`📖 Book ID: ${newBook.id}`)
    }
    
    console.log('\n🎉 Dummy book setup complete!')
    console.log('📋 Book Details:')
    console.log(`   Title: ${dummyBook.title}`)
    console.log(`   Author: ${dummyBook.author}`)
    console.log(`   ISBN: ${dummyBook.isbn}`)
    console.log(`   Content Warnings: ${sampleContentWarnings.length}`)
    console.log('\n🔗 You can now test with:')
    console.log(`   - ISBN: ${dummyBook.isbn}`)
    console.log(`   - Book page: /book/${dummyBook.isbn}`)
    console.log('\n💡 To test the scanning:')
    console.log('   1. Start your dev server: npm run dev')
    console.log('   2. Go to the homepage')
    console.log('   3. Enter ISBN: 9781234567890')
    console.log('   4. Or visit: http://localhost:3000/book/9781234567890')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
createDummyBook()
