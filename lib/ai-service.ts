import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "")

export interface GeneratedWarning {
  category: string
  description: string
  severity: "Low" | "Medium" | "High" | "Critical"
}

export async function generateContentWarnings(book: {
  title: string
  author?: string
  description?: string
  categories?: string[]
}): Promise<GeneratedWarning[]> {
  if (!process.env.GOOGLE_API_KEY) {
    console.warn("[AI Service] Missing GOOGLE_API_KEY, skipping warning generation")
    return []
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
      Analyze the following book for potential content warnings/triggers.
      
      Title: ${book.title}
      Author: ${book.author || "Unknown"}
      Categories: ${book.categories?.join(", ") || "None"}
      Description: ${book.description || "No description available"}
      
      Identify potential content warnings such as violence, abuse, self-harm, sexual content, death, mental illness, discrimination, etc.
      
      Return a JSON array of objects with the following structure:
      [
        {
          "category": "Category Name (e.g., Violence, Sexual Content)",
          "description": "Brief explanation of why this warning applies",
          "severity": "Low" | "Medium" | "High" | "Critical"
        }
      ]
      
      If no significant warnings are found, return an empty array [].
      Do not include minor or trivial warnings. Focus on things that would genuinely trigger or upset readers.
      Ensure the output is valid JSON.
    `

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()
    
    // Clean up the response to ensure it's valid JSON
    const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim()
    
    try {
      const warnings: GeneratedWarning[] = JSON.parse(jsonStr)
      return warnings
    } catch (parseError) {
      console.error("[AI Service] Failed to parse AI response:", text)
      return []
    }
  } catch (error) {
    console.error("[AI Service] Error generating warnings:", error)
    return []
  }
}
