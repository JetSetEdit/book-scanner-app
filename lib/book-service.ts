import { createClient } from "@/lib/supabase/server"
import { fetchBookByISBN } from "@/lib/book-api"
import { generateContentWarnings } from "@/lib/ai-service"

export async function ensureBookExists(isbn: string) {
    const supabase = await createClient()

    // Clean ISBN
    const cleanIsbn = isbn.replace(/[-\s]/g, "")

    if (!cleanIsbn) {
        return { error: "Please provide a valid ISBN" }
    }

    try {
        // 1. Check if book exists in DB
        const { data: existingBook } = await supabase
            .from("books")
            .select("*")
            .eq("isbn", cleanIsbn)
            .maybeSingle()

        if (existingBook) {
            return { success: true, book: existingBook }
        }

        // 2. Book doesn't exist, fetch from external APIs
        const bookData = await fetchBookByISBN(cleanIsbn)

        if (!bookData) {
            return {
                error: "Book not found. Please check the ISBN and try again.",
            }
        }

        // 3. Insert book into database
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
            })
            .select()
            .single()

        if (insertError || !newBook) {
            console.error("[Book Service] Error inserting book:", insertError)
            return { error: "Failed to save book data. Please try again." }
        }

        // 4. Generate and insert content warnings
        // We do this asynchronously but await it here to ensure the user sees them immediately
        // In a production app, this might be better as a background job
        const warnings = await generateContentWarnings({
            title: newBook.title,
            author: newBook.author,
            description: newBook.description,
            categories: newBook.categories,
        })

        if (warnings.length > 0) {
            const warningsToInsert = warnings.map(w => ({
                book_id: newBook.id,
                category: w.category,
                description: w.description,
                severity: w.severity,
                helpful_count: 0,
                not_helpful_count: 0
            }))

            const { error: warningError } = await supabase
                .from("content_warnings")
                .insert(warningsToInsert)

            if (warningError) {
                console.error("[Book Service] Error inserting warnings:", warningError)
                // We don't fail the whole request if warnings fail, just log it
            }
        }

        return { success: true, book: newBook }
    } catch (error) {
        console.error("[Book Service] Error in ensureBookExists:", error)
        return { error: "An unexpected error occurred. Please try again." }
    }
}
