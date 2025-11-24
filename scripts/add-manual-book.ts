import fs from 'fs';
import path from 'path';

async function addManualBook(isbn: string, title: string, author: string) {
    // 1. Load env vars
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

    // 2. Import dependencies
    const { createClient } = await import('@supabase/supabase-js');
    const { generateContentWarnings } = await import('../lib/content-warning-agent');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`📖 Adding manual book entry for ISBN: ${isbn}`);
    console.log(`   Title: ${title}`);
    console.log(`   Author: ${author}\n`);

    // 3. Check if book already exists
    const { data: existing } = await supabase
        .from('books')
        .select('id')
        .eq('isbn', isbn)
        .single();

    if (existing) {
        console.log('⚠️  Book already exists in database. Updating...');
    }

    // 4. Generate warnings based on title/author
    console.log('🤖 Generating content warnings...');
    const warnings = await generateContentWarnings({
        book_title: title,
        book_author: author,
        book_description: `Pre-release or manually added book. Analysis based on author's typical content and genre conventions.`,
        book_isbn: isbn
    });

    console.log(`   Generated ${warnings.content_warnings.length} warnings`);
    console.log(`   Classification: ${warnings.classification_rating || 'N/A'}`);
    console.log(`   Confidence: ${warnings.confidence}\n`);

    // 5. Create or update book record
    const bookData = {
        isbn,
        title,
        author,
        description: `Pre-release or manually added book. Analysis based on author's typical content and genre conventions.`,
        categories: warnings.classification_rating ? [`CLASSIFICATION:${warnings.classification_rating}`] : []
    };

    let bookId: string;
    if (existing) {
        await supabase
            .from('books')
            .update(bookData)
            .eq('id', existing.id);
        bookId = existing.id;
    } else {
        const { data: newBook } = await supabase
            .from('books')
            .insert(bookData)
            .select('id')
            .single();
        bookId = newBook!.id;
    }

    // 6. Save warnings
    if (warnings.content_warnings.length > 0) {
        const warningsToInsert = warnings.content_warnings.map((w: any) => ({
            book_id: bookId,
            category: w.category,
            description: w.description,
            severity: w.severity,
            user_id: null,
            reasoning: w.reasoning || null,
            is_author_verified: w.is_author_verified || false,
            source_url: w.source_url || null
        }));

        await supabase
            .from('content_warnings')
            .delete()
            .eq('book_id', bookId);

        await supabase
            .from('content_warnings')
            .insert(warningsToInsert);

        console.log('✅ Book and warnings saved successfully!');
    } else {
        console.log('✅ Book saved (no warnings needed)');
    }
}

// Parse command line args
const isbn = process.argv[2];
const title = process.argv[3];
const author = process.argv[4];

if (!isbn || !title || !author) {
    console.log('Usage: npx tsx scripts/add-manual-book.ts <ISBN> "<Title>" "<Author>"');
    console.log('Example: npx tsx scripts/add-manual-book.ts 9781662524523 "The Pucking Proposal" "Lauren Landish"');
    process.exit(1);
}

addManualBook(isbn, title, author);
