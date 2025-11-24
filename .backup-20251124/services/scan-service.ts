import { createClient } from '@supabase/supabase-js'
import { fetchBookByISBN } from '@/lib/book-api'
import { generateContentWarnings } from '@/lib/content-warning-agent'
import { findBookAndGenerateWarnings } from '@/lib/agent-chain'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Define types locally since we might be missing the types file
interface Book {
    id: string
    isbn: string
    title: string
    author?: string
    description?: string
    categories?: string[]
    cover_url?: string
    publisher?: string
    published_date?: string
    page_count?: number
    review_status?: string
    classification_rating?: string
}

interface ScanResult {
    success: boolean
    book?: Book
    scan?: any
    isNewBook?: boolean
    contentWarningsGenerated?: boolean
    authorContextInvestigated?: boolean
    error?: string
}

interface ContentWarningInsert {
    book_id: string
    category: string
    description: string
    severity: string
    user_id: string | null
    reasoning: string | null
    is_author_verified: boolean
    source_url: string | null
}

export async function scanBook(isbn: string, userId?: string, onProgress?: (message: string) => void): Promise<ScanResult> {
    const cleanIsbn = isbn.replace(/[-\s]/g, '')

    if (!cleanIsbn) {
        return { success: false, error: 'Invalid ISBN' }
    }

    console.log(`Scanning book: ${cleanIsbn}`)
    onProgress?.('Checking database for existing book...')

    let bookId: string | null = null
    let currentBook: Book | null = null
    let existingBook = false
    let contentWarningsGenerated = false

    try {
        // 1. Check if book exists in our DB
        const { data: existingBookData, error: fetchError } = await supabaseAdmin
            .from('books')
            .select('*')
            .eq('isbn', cleanIsbn)
            .maybeSingle()

        if (fetchError) {
            console.error('Error fetching book:', fetchError)
            // Continue to try fetching from API
        }

        if (existingBookData) {
            console.log('Book found in database:', existingBookData.title)
            onProgress?.(`Found "${existingBookData.title}" in database.`)
            bookId = existingBookData.id
            currentBook = existingBookData
            existingBook = true
        } else {
            // 2. Fetch from external APIs
            console.log('Book not in DB, fetching from external APIs...')
            onProgress?.('Book not found locally. Searching external libraries...')

            const bookData = await fetchBookByISBN(cleanIsbn)

            if (!bookData) {
                console.log('Book not found in external APIs')
                // Fallback: Create a minimal record so we can still process it
                // This matches the "NoMetadata -> CreateMinimal" flow
                onProgress?.('Metadata not found. Creating minimal record...')

                const { data: newBook, error: insertError } = await supabaseAdmin
                    .from('books')
                    .insert({
                        isbn: cleanIsbn,
                        title: 'Unknown Title',
                        author: 'Unknown Author',
                        review_status: 'pending'
                    })
                    .select()
                    .single()

                if (insertError || !newBook) {
                    return { success: false, error: 'Failed to create book record' }
                }

                bookId = newBook.id
                currentBook = newBook
            } else {
                // Insert new book with metadata
                onProgress?.(`Found "${bookData.title}". Saving to database...`)

                const { data: newBook, error: insertError } = await supabaseAdmin
                    .from('books')
                    .insert({
                        isbn: bookData.isbn,
                        title: bookData.title,
                        author: bookData.author,
                        cover_url: bookData.cover_url,
                        description: bookData.description,
                        publisher: bookData.publisher,
                        published_date: bookData.published_date,
                        page_count: bookData.page_count,
                        categories: bookData.categories,
                        classification_rating: bookData.classification_rating || null,
                        review_status: 'pending'
                    })
                    .select()
                    .single()

                if (insertError) {
                    console.error('Error inserting book:', insertError)
                    return { success: false, error: 'Failed to save book' }
                }

                bookId = newBook.id
                currentBook = newBook
            }
        }

        // 3. Generate Content Warnings if needed
        if (bookId && currentBook) {
            // Check if warnings already exist
            const { data: existingWarnings } = await supabaseAdmin
                .from('content_warnings')
                .select('id')
                .eq('book_id', bookId)

            if (!existingWarnings || existingWarnings.length === 0) {
                console.log('No existing warnings, generating...')
                onProgress?.('Analyzing content for warnings...')

                // Determine which analysis method to use
                const isThinDescription = !currentBook.description || currentBook.description.length < 150;
                let result;
                let usedSearch = false;
                let classificationRating = currentBook.classification_rating;

                // LOGIC BRANCHING based on diagram
                if (isThinDescription) {
                    // THIN METADATA -> Web Search (findBookAndGenerateWarnings)
                    console.log("Thin metadata detected. Using Web Search Agent...");
                    onProgress?.('Metadata is thin. Using AI Web Search for deeper analysis...');

                    const searchResult = await findBookAndGenerateWarnings(currentBook.isbn);

                    // Map search result to common format
                    result = {
                        content_warnings: searchResult.content_warnings,
                        confidence: searchResult.confidence,
                        reasoning: searchResult.reasoning,
                        classification_rating: (searchResult as any).classification_rating
                    };
                    classificationRating = (searchResult as any).classification_rating || null;
                    usedSearch = true;

                    // If we found better metadata via search, update the book!
                    if (searchResult.book_found) {
                        const updates: any = {};
                        if (currentBook.title === 'Unknown Title' && searchResult.book_title) updates.title = searchResult.book_title;
                        if (currentBook.author === 'Unknown Author' && searchResult.book_author) updates.author = searchResult.book_author;
                        if (!currentBook.description && searchResult.book_description) updates.description = searchResult.book_description;

                        if (Object.keys(updates).length > 0) {
                            console.log("Updating book with metadata found during search...");
                            await supabaseAdmin.from('books').update(updates).eq('id', bookId);
                            // Update local object for logging
                            currentBook = { ...currentBook, ...updates };
                        }
                    }

                } else {
                    // GOOD METADATA -> Metadata Analysis (generateContentWarnings)
                    console.log("Good metadata detected. Using Metadata Analysis Agent...");
                    onProgress?.('Analyzing book metadata for content warnings...');

                    result = await generateContentWarnings({
                        book_title: currentBook.title,
                        book_author: currentBook.author || 'Unknown',
                        book_description: currentBook.description || undefined,
                        book_categories: currentBook.categories || undefined,
                        book_isbn: currentBook.isbn
                    });
                    classificationRating = (result as any).classification_rating || null;

                    // DOUBLE CHECK: If standard analysis says "Safe" (no warnings),
                    // force a web search verification to avoid false negatives.
                    if (result.content_warnings.length === 0) {
                        console.log("Initial analysis found no warnings. Performing deep search verification...");
                        onProgress?.("Initial text analysis safe. Verifying with web search...");

                        const searchResult = await findBookAndGenerateWarnings(currentBook.isbn);

                        // Handle "Book Not Found" in Deep Search
                        if (!searchResult.book_found) {
                            console.log("Deep search failed to find book info.");
                            onProgress?.("⚠️ Deep search could not verify book details.");

                            // If we have local metadata, we keep the "Safe" verdict but with Low confidence and a warning in reasoning
                            result.confidence = 'low';
                            result.reasoning = `${result.reasoning} (Note: Deep web search could not confirm this safety rating due to lack of online results. Manual review recommended.)`;
                            usedSearch = true;
                        }
                        // If search found something, OVERRIDE the initial result
                        else if (searchResult.content_warnings.length > 0) {
                            console.log("Deep search found warnings that initial analysis missed!");
                            onProgress?.(`Deep search found ${searchResult.content_warnings.length} hidden warnings.`);

                            result = {
                                content_warnings: searchResult.content_warnings,
                                confidence: searchResult.confidence,
                                reasoning: `Initial text analysis missed triggers. Web search correction: ${searchResult.reasoning}`,
                                classification_rating: (searchResult as any).classification_rating
                            };
                            classificationRating = (searchResult as any).classification_rating || null;
                            usedSearch = true;
                        } else {
                            // If search ALSO found nothing, update reasoning to show we double checked
                            result.reasoning = `${result.reasoning} (Web search verification confirmed no significant warnings found).`;
                            usedSearch = true;
                        }
                    }
                }

                // Update book with classification rating if we got one
                if (classificationRating && currentBook) {
                    const categories = currentBook.categories || [];
                    const hasClassification = categories.some(c => c.startsWith('CLASSIFICATION:'));
                    if (!hasClassification) {
                        categories.push(`CLASSIFICATION:${classificationRating}`);
                        await supabaseAdmin
                            .from('books')
                            .update({ categories })
                            .eq('id', bookId);
                    }
                }

                // Log the decision
                console.log(`[Audit] Decision: ${result.content_warnings.length > 0 ? 'warnings_generated' : 'no_warnings'}, Reasoning: ${result.reasoning}`);

                if (result.content_warnings.length > 0) {
                    // Insert the generated warnings
                    onProgress?.(`AI analysis complete. Saving ${result.content_warnings.length} warnings...`);

                    const warningsToInsert: ContentWarningInsert[] = result.content_warnings.map((warning: any) => ({
                        book_id: bookId!,
                        category: warning.category,
                        description: warning.description,
                        severity: warning.severity,
                        user_id: null,
                        reasoning: warning.reasoning || null,
                        is_author_verified: warning.is_author_verified || false,
                        source_url: warning.source_url || null
                    }))

                    const { error: insertError } = await supabaseAdmin
                        .from('content_warnings')
                        .insert(warningsToInsert)

                    if (!insertError) {
                        contentWarningsGenerated = true
                        console.log(`Generated ${result.content_warnings.length} content warnings`)
                    } else {
                        console.error('Failed to insert AI-generated warnings:', insertError)
                    }
                } else {
                    onProgress?.('AI analysis complete. No specific warnings generated.');
                }
            } else {
                onProgress?.(`Found ${existingWarnings.length} existing content warnings.`);
            }
        }
    } catch (warningError) {
        console.error('Error generating content warnings:', warningError)
        // Don't fail the scan if warning generation fails
    }

    onProgress?.('Scan completed successfully.');
    const scan = { id: 'temp-scan-id', isbn: cleanIsbn, book_id: bookId }

    return {
        success: true,
        book: currentBook || { id: bookId!, isbn: cleanIsbn, title: 'Unknown', review_status: 'pending' },
        scan: scan,
        isNewBook: !existingBook,
        contentWarningsGenerated
    }
}
