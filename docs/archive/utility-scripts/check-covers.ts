
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function validateImageUrl(url: string): Promise<boolean> {
    try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 8000); // 8 second timeout

        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            headers: { 'User-Agent': 'Book-Scanner-App/1.0' },
            redirect: 'follow'
        });

        clearTimeout(id);

        if (!response.ok) return false;

        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');

        if (contentType && !contentType.startsWith('image/')) return false;
        if (contentLength) {
            const size = parseInt(contentLength);
            if (size < 1000) return false;
            if (size === 15567) return false; // Block Google Books placeholder
        }

        return true;
    } catch (error) {
        return false;
    }
}

async function checkCovers() {
    console.log("🔍 Auditing Book Covers...");

    const { data: books, error } = await supabase
        .from('books')
        .select('id, title, isbn, cover_url');

    if (error) {
        console.error("Error fetching books:", error);
        return;
    }

    console.log(`Found ${books.length} books in database.`);

    let missingCount = 0;
    let brokenCount = 0;
    let validCount = 0;

    for (const book of books) {
        if (!book.cover_url) {
            console.log(`[MISSING] ${book.title} (ISBN: ${book.isbn})`);
            missingCount++;
        } else {
            console.log(`[CHECKING] ${book.title} - URL: ${book.cover_url}`);
            const isValid = await validateImageUrl(book.cover_url);
            if (!isValid) {
                console.log(`[BROKEN]  ${book.title} (ISBN: ${book.isbn}) - URL: ${book.cover_url}`);
                console.log(`   ↳ Clearing broken cover URL...`);

                const { error: updateError } = await supabase
                    .from('books')
                    .update({ cover_url: null })
                    .eq('id', book.id);

                if (updateError) {
                    console.error(`   ❌ Failed to clear cover: ${updateError.message}`);
                } else {
                    console.log(`   ✅ Cover cleared.`);
                }
                brokenCount++;
            } else {
                validCount++;
            }
        }
    }

    console.log("\n--- Summary ---");
    console.log(`✅ Valid Covers: ${validCount}`);
    console.log(`❌ Missing Covers: ${missingCount}`);
    console.log(`⚠️ Broken Covers: ${brokenCount}`);
}

checkCovers();
