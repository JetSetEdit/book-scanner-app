"use server"

import { createClient } from "@/lib/supabase/server"
import { fetchBookByISBN } from "@/lib/book-api"

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

    // Book doesn't exist, fetch from external API
    const bookData = await fetchBookByISBN(cleanIsbn)

    if (!bookData) {
      return {
        error: "Book not found. Please check the ISBN and try again.",
      }
    }

    // Insert book into database
    const { error: insertError } = await supabase.from("books").insert({
      isbn: bookData.isbn,
      title: bookData.title,
      author: bookData.author,
      cover_url: bookData.cover_url,
      description: bookData.description,
      publisher: bookData.publisher,
      published_date: bookData.published_date,
      page_count: bookData.page_count,
      categories: bookData.categories,
    })

    if (insertError) {
      console.error("[v0] Error inserting book:", insertError)
      return { error: "Failed to save book data. Please try again." }
    }

    return { success: true, isbn: cleanIsbn }
  } catch (error) {
    console.error("[v0] Error in lookupBook:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}
