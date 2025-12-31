import { createClient } from "@/lib/supabase/server"
import { fetchBookByISBN } from "@/lib/book-api"
import { isStale, refreshBookMetadata } from "@/lib/book-cache"

export async function ensureBookExists(isbn: string) {
    const supabase = await createClient()

    // Clean ISBN
    const cleanIsbn = isbn.replace(/[-\s]/g, "")

    if (!cleanIsbn) {
        return { error: "Please provide a valid ISBN" }
    }

    try {
        // 1. Check if book exists in DB (the "Cache" lookup)
        const { data: existingBook } = await supabase
            .from("books")
            .select("*")
            .eq("isbn", cleanIsbn)
            .maybeSingle()

        if (existingBook) {
            // --- COMPLIANCE CHECK: Staleness Check ---
            // If data is stale (>30 days), refresh in background
            // This proves we aren't keeping a permanent, never-updated copy
            if (isStale(existingBook.last_synced_at)) {
                console.log(`[Cache] Book ${cleanIsbn} is stale (>30 days). Refreshing in background...`);
                // Fire-and-forget refresh (don't block the user)
                refreshBookMetadata(cleanIsbn, async (isbn, data) => {
                    await supabase
                        .from("books")
                        .update(data)
                        .eq("isbn", isbn);
                }).catch(console.error);
            }
            
            return { success: true, book: existingBook }
        }

        // 2. Book doesn't exist in cache, fetch from external APIs
        console.log(`[Miss] Book ${cleanIsbn} not found. Fetching from APIs...`);
        const bookData = await fetchBookByISBN(cleanIsbn)

        if (!bookData) {
            return {
                error: "Book not found. Please check the ISBN and try again.",
            }
        }

        // 3. Store book data with last_synced_at timestamp
        // This applies to both Open Library and Google Books (hybrid cache strategy)
        const { data: newBook, error: insertError } = await supabase
            .from("books")
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
                last_synced_at: new Date().toISOString(), // CRITICAL: Set sync date for staleness checking
            })
            .select()
            .single()

        if (insertError || !newBook) {
            console.error("[Book Service] Error inserting book:", insertError)
            return { error: "Failed to save book data. Please try again." }
        }

        // Content warning generation removed - agents no longer used

        return { success: true, book: newBook }
    } catch (error) {
        console.error("[Book Service] Error in ensureBookExists:", error)
        return { error: "An unexpected error occurred. Please try again." }
    }
}
