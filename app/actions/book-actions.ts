"use server"

import { createClient } from "@/lib/supabase/server"
import { fetchBookByISBN } from "@/lib/book-api"
import { storyGraphAPI } from "@/lib/storygraph-api"

export async function lookupBook(isbn: string) {
  const supabase = await createClient()

  // Clean ISBN
  const cleanIsbn = isbn.replace(/[-\s]/g, "")

  if (!cleanIsbn) {
    return { error: "Please provide a valid ISBN" }
  }

  try {
    const { data: existingBook, error: fetchError } = await supabase
      .from("books")
      .select("isbn")
      .eq("isbn", cleanIsbn)
      .maybeSingle()

    if (existingBook) {
      return { success: true, isbn: cleanIsbn }
    }

        // Book doesn't exist, fetch from external APIs
        const bookData = await fetchBookByISBN(cleanIsbn)
        
        // Also try to get StoryGraph data for enhanced content warnings
        let storyGraphData = null
        try {
          const storyGraphResult = await storyGraphAPI.searchByISBN(cleanIsbn)
          if (storyGraphResult.success && storyGraphResult.data) {
            storyGraphData = storyGraphResult.data
            console.log("[v0] Found StoryGraph data:", storyGraphData.title)
          }
        } catch (error) {
          console.log("[v0] StoryGraph lookup failed:", error)
        }

        if (!bookData) {
          return {
            error: "Book not found. Please check the ISBN and try again.",
          }
        }

        // Insert book into database with enhanced data
        const { error: insertError } = await supabase.from("books").insert({
          isbn: bookData.isbn,
          title: bookData.title,
          author: bookData.author,
          cover_url: bookData.cover_url || storyGraphData?.cover_url,
          description: bookData.description || storyGraphData?.description,
          publisher: bookData.publisher,
          published_date: bookData.published_date,
          page_count: bookData.page_count || (storyGraphData?.pages ? parseInt(storyGraphData.pages) : undefined),
          categories: bookData.categories || storyGraphData?.tags,
          storygraph_rating: storyGraphData?.average_rating ? parseFloat(storyGraphData.average_rating) : null,
        })

        if (insertError) {
          console.error("[v0] Error inserting book:", insertError)
          return { error: "Failed to save book data. Please try again." }
        }

        // If we have StoryGraph data, add content warnings
        if (storyGraphData?.warnings) {
          try {
            const { data: insertedBook } = await supabase
              .from("books")
              .select("id")
              .eq("isbn", cleanIsbn)
              .single()

            if (insertedBook) {
              const warnings = storyGraphAPI.convertWarnings(storyGraphData.warnings)
              
              for (const warning of warnings) {
                await supabase.from("content_warnings").insert({
                  book_id: insertedBook.id,
                  category: warning.category,
                  description: warning.description,
                  severity: warning.severity,
                  helpful_count: 0,
                  not_helpful_count: 0
                })
              }
              
              console.log(`[v0] Added ${warnings.length} content warnings from StoryGraph`)
            }
          } catch (error) {
            console.error("[v0] Error adding StoryGraph warnings:", error)
            // Don't fail the whole operation if warnings fail
          }
        }

        return { success: true, isbn: cleanIsbn }
  } catch (error) {
    console.error("[v0] Error in lookupBook:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}
