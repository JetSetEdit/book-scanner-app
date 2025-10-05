"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addContentWarning(
  bookId: string,
  data: {
    category: string
    description: string
    severity: string
  },
) {
  const supabase = await createClient()

  try {
    const { error } = await supabase.from("content_warnings").insert({
      book_id: bookId,
      category: data.category,
      description: data.description,
      severity: data.severity,
    })

    if (error) {
      console.error("[v0] Error adding content warning:", error)
      return { error: "Failed to add content warning. Please try again." }
    }

    // Revalidate the book page to show the new warning
    const { data: book } = await supabase.from("books").select("isbn").eq("id", bookId).single()

    if (book) {
      revalidatePath(`/book/${book.isbn}`)
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error adding warning:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function addSpiceRating(
  bookId: string,
  data: {
    spiceLevel: number
    ageRating: string
  },
) {
  const supabase = await createClient()

  try {
    const { error } = await supabase.from("spice_ratings").insert({
      book_id: bookId,
      spice_level: data.spiceLevel,
      age_rating: data.ageRating,
    })

    if (error) {
      console.error("[v0] Error adding spice rating:", error)
      return { error: "Failed to add rating. Please try again." }
    }

    // Revalidate the book page to show the updated rating
    const { data: book } = await supabase.from("books").select("isbn").eq("id", bookId).single()

    if (book) {
      revalidatePath(`/book/${book.isbn}`)
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error adding rating:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function validateWarning(warningId: string, isHelpful: boolean) {
  const supabase = await createClient()

  try {
    console.log(`[v0] Starting validation for warning ${warningId}, isHelpful: ${isHelpful}`)
    
    // First, get the current warning to get the current counts
    const { data: currentWarning, error: fetchError } = await supabase
      .from("content_warnings")
      .select("helpful_count, not_helpful_count")
      .eq("id", warningId)
      .single()
    
    if (fetchError) {
      console.error("[v0] Error fetching warning:", fetchError)
      return { error: "Failed to validate warning. Please try again." }
    }
    
    console.log(`[v0] Current counts: helpful=${currentWarning.helpful_count}, not_helpful=${currentWarning.not_helpful_count}`)
    
    if (isHelpful) {
      const newCount = (currentWarning.helpful_count || 0) + 1
      console.log(`[v0] Updating helpful count to: ${newCount}`)
      
      const { error } = await supabase
        .from("content_warnings")
        .update({ helpful_count: newCount })
        .eq("id", warningId)
      
      if (error) {
        console.error("[v0] Error updating helpful count:", error)
        return { error: "Failed to validate warning. Please try again." }
      }
    } else {
      const newCount = (currentWarning.not_helpful_count || 0) + 1
      console.log(`[v0] Updating not helpful count to: ${newCount}`)
      
      const { error } = await supabase
        .from("content_warnings")
        .update({ not_helpful_count: newCount })
        .eq("id", warningId)
      
      if (error) {
        console.error("[v0] Error updating not helpful count:", error)
        return { error: "Failed to validate warning. Please try again." }
      }
    }

    console.log("[v0] Validation successful!")
    
    // Revalidate the debug page and any book pages that might show this warning
    revalidatePath("/debug-thumbs")
    
    // Also revalidate any book pages (we don't know which book this warning belongs to, 
    // but revalidatePath with a pattern would be ideal here)
    revalidatePath("/book/[isbn]", "page")
    
    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error validating warning:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}
