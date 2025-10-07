import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  const supabase = await createClient()

  try {
    // First, let's check if the column already exists
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'books')
      .eq('column_name', 'classification_rating')

    if (columnError) {
      console.error("Error checking columns:", columnError)
      return NextResponse.json({ error: "Failed to check columns" }, { status: 500 })
    }

    if (columns && columns.length > 0) {
      return NextResponse.json({ message: "classification_rating column already exists" })
    }

    // If column doesn't exist, we need to add it
    // Since we can't use ALTER TABLE directly, let's try a different approach
    // We'll create a new table with the column and migrate data
    
    return NextResponse.json({ 
      message: "Column check completed", 
      columnExists: columns && columns.length > 0,
      note: "Direct ALTER TABLE not available via Supabase client"
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
