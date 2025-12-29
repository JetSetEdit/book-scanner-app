import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.+)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tawolulyrlnpxjyyxpdw.supabase.co"
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhd29sdWx5cmxucHhqeXl4cGR3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ5NDM5NywiZXhwIjoyMDc1MDcwMzk3fQ.ige4kgvZav25IO9cINTl6mPgg-ACHDsG8t-hLBiGqSM"

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixAssumptionBook(isbn: string) {
    console.log(`🔧 Fixing book with assumptions: ${isbn}\n`)

    // Step 1: Find the book
    console.log('📖 Step 1: Finding book in database...')
    const { data: book, error: bookError } = await supabase
        .from('books')
        .select('id, title, author')
        .eq('isbn', isbn)
        .single()

    if (bookError || !book) {
        console.error(`❌ Book not found: ${bookError?.message || 'Not found'}`)
        return
    }

    console.log(`   Found: "${book.title}" by ${book.author}`)
    console.log(`   Book ID: ${book.id}\n`)

    // Step 2: Delete existing content warnings
    console.log('🗑️  Step 2: Deleting existing content warnings...')
    const { error: deleteError } = await supabase
        .from('content_warnings')
        .delete()
        .eq('book_id', book.id)

    if (deleteError) {
        console.error(`❌ Failed to delete warnings: ${deleteError.message}`)
        return
    }

    console.log('   ✅ Existing warnings deleted\n')

    // Step 3: Delete audit logs for this book (optional, but helps clean state)
    console.log('🧹 Step 3: Cleaning audit logs...')
    const { error: auditError } = await supabase
        .from('ai_audit_logs')
        .delete()
        .eq('book_id', book.id)

    if (auditError) {
        console.warn(`   ⚠️  Could not delete audit logs: ${auditError.message}`)
    } else {
        console.log('   ✅ Audit logs cleaned\n')
    }

    // Step 4: Rescan the book with the fixed prompt
    console.log('🔄 Step 4: Rescanning book with fixed prompt...')
    console.log('   (This will use the new evidence-based analysis)\n')

    // Import and call the scan service directly
    const { processIsbnScan } = await import('../lib/services/scan-service')

    try {
        const result = await processIsbnScan(
            isbn,
            (message) => {
                console.log(`   ${message}`)
            },
            undefined, // selectedCandidate
            true // forceRefresh
        )

        if (!result.success) {
            console.error(`❌ Rescan failed: ${result}`)
            return
        }

        console.log('\n✅ Rescan complete!')
    } catch (error) {
        console.error(`❌ Rescan error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        return
    }

    // Step 5: Verify the new warnings
    console.log('\n📊 Step 5: Verifying new warnings...')
    const { data: newWarnings, error: warningsError } = await supabase
        .from('content_warnings')
        .select('id, category_id, description, severity, reasoning')
        .eq('book_id', book.id)

    if (warningsError) {
        console.error(`❌ Failed to fetch warnings: ${warningsError.message}`)
        return
    }

    console.log(`\n   New warnings count: ${newWarnings?.length || 0}`)

    if (newWarnings && newWarnings.length > 0) {
        console.log('\n   ⚠️  Warnings generated:')
        newWarnings.forEach((w, i) => {
            console.log(`   ${i + 1}. ${w.category_id} (${w.severity})`)
            console.log(`      Description: ${w.description}`)
            if (w.reasoning) {
                const reasoningPreview = w.reasoning.substring(0, 100)
                console.log(`      Reasoning: ${reasoningPreview}${w.reasoning.length > 100 ? '...' : ''}`)
            }
        })
    } else {
        console.log('\n   ✅ No warnings generated (as expected for this book)')
    }

    // Check for assumptions in reasoning
    const hasAssumptions = newWarnings?.some(w => {
        const reasoning = (w.reasoning || '').toLowerCase()
        return reasoning.includes("harper lee's known") ||
               reasoning.includes("consistent with") ||
               reasoning.includes("author's other") ||
               reasoning.includes("typical themes")
    })

    if (hasAssumptions) {
        console.log('\n   ❌ PROBLEM: Still contains assumptions!')
    } else {
        console.log('\n   ✅ GOOD: No assumptions detected in reasoning')
    }

    console.log('\n🎉 Fix complete!')
    console.log(`\n   View the book at: https://subtext-books.vercel.app/book/${isbn}`)
}

const isbn = process.argv[2] || '9781529155419'
if (!isbn) {
    console.log('Usage: npx tsx scripts/fix-assumption-book.ts [ISBN]')
    console.log('Example: npx tsx scripts/fix-assumption-book.ts 9781529155419')
} else {
    fixAssumptionBook(isbn).catch(console.error)
}

