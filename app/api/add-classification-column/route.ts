import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  const supabase = await createClient()

  try {
    // Add the classification_rating column to the books table
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.books ADD COLUMN IF NOT EXISTS classification_rating TEXT;'
    })

    if (error) {
      console.error("Error adding classification_rating column:", error)
      return NextResponse.json({ error: "Failed to add classification_rating column" }, { status: 500 })
    }

    return NextResponse.json({ message: "classification_rating column added successfully" })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
