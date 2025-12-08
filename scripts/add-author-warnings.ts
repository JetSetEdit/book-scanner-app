import fs from 'fs';
import path from 'path';

async function addAuthorWarnings() {
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

    const { createClient } = await import('@supabase/supabase-js');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse command line args
    const args = process.argv.slice(2);
    if (args.length < 3) {
        console.log('Usage: npx tsx scripts/add-author-warnings.ts <isbn> <source_url> "<warning1>" "<warning2>" ...');
        console.log('');
        console.log('Example:');
        console.log('npx tsx scripts/add-author-warnings.ts \\');
        console.log('  9780349433883 \\');
        console.log('  "https://www.hannahgrace.co.uk/books" \\');
        console.log('  "Disordered eating" \\');
        console.log('  "Sexual content (consensual)" \\');
        console.log('  "Toxic friendships" \\');
        console.log('  "Mental health (anxiety and stress)" \\');
        console.log('  "Near death experience" \\');
        console.log('  "Death of a parent (past event, only discussed)" \\');
        console.log('  "Cheating"');
        process.exit(1);
    }

    const isbn = args[0];
    const sourceUrl = args[1];
    const warnings = args.slice(2);

    console.log(`📖 Adding author-provided warnings for ISBN: ${isbn}`);
    console.log(`   Source: ${sourceUrl}`);
    console.log(`   Warnings: ${warnings.length}\n`);

    // Find the book
    let { data: book, error: bookError } = await supabase
        .from('books')
        .select('id, title, author')
        .eq('isbn', isbn)
        .single();

    // If book doesn't exist, try to fetch it from APIs and add it
    if (bookError || !book) {
        console.log(`📚 Book not found. Fetching metadata from APIs...`);
        const { fetchBookByISBN } = await import('../lib/book-api');
        const bookData = await fetchBookByISBN(isbn);
        
        if (!bookData) {
            console.error(`❌ Could not find book metadata for ISBN: ${isbn}`);
            console.error('   Please scan the book first at: http://localhost:3000/scan-test');
            process.exit(1);
        }
        
        // Add book to database
        const { data: newBook, error: insertError } = await supabase
            .from('books')
            .insert({
                isbn: bookData.isbn,
                title: bookData.title,
                author: bookData.author,
                description: bookData.description,
                cover_url: bookData.cover_url,
                publisher: bookData.publisher,
                published_date: bookData.published_date,
                page_count: bookData.page_count,
                categories: bookData.categories,
            })
            .select('id, title, author')
            .single();
        
        if (insertError || !newBook) {
            console.error(`❌ Error adding book:`, insertError);
            process.exit(1);
        }
        
        book = newBook;
        console.log(`✅ Added book: "${book.title}" by ${book.author}\n`);
    }

    console.log(`✅ Found book: "${book.title}" by ${book.author}\n`);

    // Import taxonomy for category mapping
    const { WARNING_CATEGORIES } = await import('../lib/config/taxonomy');

    // Map warnings to categories (using category_id from taxonomy)
    const categoryMap: Record<string, string> = {
        'disordered eating': 'mental_health',
        'sexual content': 'sexual_content',
        'toxic friendships': 'emotional_abuse_or_toxic_relationships',
        'mental health': 'mental_health',
        'anxiety': 'mental_health',
        'stress': 'mental_health',
        'near death': 'death_or_grief',
        'death': 'death_or_grief',
        'parent': 'death_or_grief',
        'cheating': 'emotional_abuse_or_toxic_relationships',
        'violence': 'violence',
        'substance': 'substance_use_or_alcohol',
        'alcohol': 'substance_use_or_alcohol',
        'drug': 'substance_use_or_alcohol',
        'self harm': 'self_harm_or_suicidal_ideation',
        'suicide': 'self_harm_or_suicidal_ideation',
        'bullying': 'bullying_or_social_cruelty',
        'discrimination': 'discrimination',
        'language': 'language',
    };
    
    // Map category_id to legacy category field
    const legacyCategoryMap: Record<string, string> = {
        'mental_health': 'mental_health',
        'sexual_content': 'sexual_content',
        'emotional_abuse_or_toxic_relationships': 'abuse',
        'bullying_or_social_cruelty': 'abuse',
        'violence': 'violence',
        'substance_use_or_alcohol': 'substance_abuse',
        'self_harm_or_suicidal_ideation': 'mental_health',
        'death_or_grief': 'death',
        'discrimination': 'discrimination',
        'language': 'other',
        'other': 'other',
    };

    function mapWarningToCategory(warning: string): string {
        const lower = warning.toLowerCase();
        for (const [key, category] of Object.entries(categoryMap)) {
            if (lower.includes(key)) {
                return category;
            }
        }
        return 'other';
    }

    function estimateSeverity(warning: string): 'mild' | 'moderate' | 'severe' {
        const lower = warning.toLowerCase();
        // Severe indicators
        if (lower.includes('severe') || lower.includes('graphic') || lower.includes('explicit') || 
            lower.includes('death') || lower.includes('suicide') || lower.includes('self harm')) {
            return 'severe';
        }
        // Moderate indicators
        if (lower.includes('moderate') || lower.includes('frequent') || lower.includes('detailed') ||
            lower.includes('sexual') || lower.includes('violence') || lower.includes('abuse')) {
            return 'moderate';
        }
        // Default to mild
        return 'mild';
    }

    // Delete existing author-verified warnings for this book
    console.log('🗑️  Removing existing author-verified warnings...');
    await supabase
        .from('content_warnings')
        .delete()
        .eq('book_id', book.id)
        .eq('is_author_verified', true);

    // Prepare warnings to insert
    const warningsToInsert = warnings.map((warningText) => {
        const category = mapWarningToCategory(warningText);
        const severity = estimateSeverity(warningText);
        
        return {
            book_id: book.id,
            category_id: category,
            category: legacyCategoryMap[category] || 'other', // Legacy field - map to legacy category
            description: warningText.trim(),
            severity: severity,
            user_id: null, // Author-provided warnings don't have a user_id
            is_author_verified: true,
            source_url: sourceUrl,
            reasoning: `Author-provided content warning from ${sourceUrl}`,
            helpful_count: 0,
            not_helpful_count: 0,
        };
    });

    console.log(`\n📝 Adding ${warningsToInsert.length} author-verified warnings:`);
    warningsToInsert.forEach((w, i) => {
        console.log(`   ${i + 1}. [${w.severity.toUpperCase()}] ${w.description}`);
        console.log(`      Category: ${w.category_id}`);
    });

    // Insert warnings
    const { data: insertedWarnings, error: insertError } = await supabase
        .from('content_warnings')
        .insert(warningsToInsert)
        .select();

    if (insertError) {
        console.error('\n❌ Error inserting warnings:', insertError);
        process.exit(1);
    }

    console.log(`\n✅ Successfully added ${insertedWarnings.length} author-verified warnings!`);
    console.log(`\n📖 View book: http://localhost:3000/book/${isbn}`);
}

addAuthorWarnings().catch(console.error);

