/**
 * StoryGraph API integration for fetching book data
 * Based on the unofficial StoryGraph API: https://github.com/ym496/storygraph-api
 */

interface StoryGraphBook {
  title: string
  authors: string[]
  pages?: string
  first_pub?: string
  tags?: string[]
  average_rating?: string
  description?: string
  warnings?: {
    graphic?: string[]
    moderate?: string[]
    minor?: string[]
  }
  book_id?: string
  isbn?: string
  cover_url?: string
}

interface StoryGraphSearchResult {
  success: boolean
  data?: StoryGraphBook[]
  error?: string
}

interface StoryGraphBookResult {
  success: boolean
  data?: StoryGraphBook
  error?: string
}

export class StoryGraphAPI {
  private baseUrl = 'https://app.thestorygraph.com'

  /**
   * Search for books on StoryGraph
   */
  async searchBooks(query: string): Promise<StoryGraphSearchResult> {
    try {
      console.log(`[StoryGraph] Searching for: ${query}`)
      
      // Call our Python script via API
      const response = await fetch(`/api/storygraph?command=search&query=${encodeURIComponent(query)}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        // Parse the JSON string returned by Python
        const books = typeof result.data === 'string' ? JSON.parse(result.data) : result.data
        return {
          success: true,
          data: books
        }
      } else {
        return {
          success: false,
          error: result.error || 'Search failed'
        }
      }
    } catch (error) {
      console.error('[StoryGraph] Search error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get book details by StoryGraph book ID
   */
  async getBookDetails(bookId: string): Promise<StoryGraphBookResult> {
    try {
      console.log(`[StoryGraph] Getting book details for ID: ${bookId}`)
      
      // Call our Python script via API
      const response = await fetch(`/api/storygraph?command=book&query=${encodeURIComponent(bookId)}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        // Parse the JSON string returned by Python
        const book = typeof result.data === 'string' ? JSON.parse(result.data) : result.data
        return {
          success: true,
          data: book
        }
      } else {
        return {
          success: false,
          error: result.error || 'Failed to get book details'
        }
      }
    } catch (error) {
      console.error('[StoryGraph] Book details error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Search for a book by ISBN
   */
  async searchByISBN(isbn: string): Promise<StoryGraphBookResult> {
    try {
      const cleanISBN = isbn.replace(/[-\s]/g, '')
      console.log(`[StoryGraph] Searching by ISBN: ${cleanISBN}`)
      
      // Call our Python script via API
      const response = await fetch(`/api/storygraph?command=isbn&query=${encodeURIComponent(cleanISBN)}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        // Parse the JSON string returned by Python
        const book = typeof result.data === 'string' ? JSON.parse(result.data) : result.data
        return {
          success: true,
          data: book
        }
      } else {
        return {
          success: false,
          error: result.error || 'Book not found with this ISBN'
        }
      }
    } catch (error) {
      console.error('[StoryGraph] ISBN search error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Convert StoryGraph warnings to our format
   */
  convertWarnings(storyGraphWarnings: StoryGraphBook['warnings']) {
    if (!storyGraphWarnings) return []

    const warnings = []
    
    // Convert graphic warnings to severe
    if (storyGraphWarnings.graphic) {
      for (const warning of storyGraphWarnings.graphic) {
        warnings.push({
          category: this.mapWarningCategory(warning),
          description: warning,
          severity: 'severe' as const
        })
      }
    }

    // Convert moderate warnings to moderate
    if (storyGraphWarnings.moderate) {
      for (const warning of storyGraphWarnings.moderate) {
        warnings.push({
          category: this.mapWarningCategory(warning),
          description: warning,
          severity: 'moderate' as const
        })
      }
    }

    // Convert minor warnings to mild
    if (storyGraphWarnings.minor) {
      for (const warning of storyGraphWarnings.minor) {
        warnings.push({
          category: this.mapWarningCategory(warning),
          description: warning,
          severity: 'mild' as const
        })
      }
    }

    return warnings
  }

  /**
   * Map StoryGraph warning categories to our categories
   */
  private mapWarningCategory(warning: string): string {
    const lowerWarning = warning.toLowerCase()
    
    if (lowerWarning.includes('violence') || lowerWarning.includes('war')) {
      return 'violence'
    }
    if (lowerWarning.includes('sexual') || lowerWarning.includes('sex')) {
      return 'sexual_content'
    }
    if (lowerWarning.includes('death') || lowerWarning.includes('dying')) {
      return 'death'
    }
    if (lowerWarning.includes('language') || lowerWarning.includes('profanity')) {
      return 'language'
    }
    if (lowerWarning.includes('abuse') || lowerWarning.includes('trauma')) {
      return 'abuse'
    }
    if (lowerWarning.includes('mental') || lowerWarning.includes('depression')) {
      return 'mental_health'
    }
    if (lowerWarning.includes('substance') || lowerWarning.includes('drug') || lowerWarning.includes('alcohol')) {
      return 'substance_abuse'
    }
    if (lowerWarning.includes('discrimination') || lowerWarning.includes('racism')) {
      return 'discrimination'
    }
    
    return 'other'
  }
}

// Export singleton instance
export const storyGraphAPI = new StoryGraphAPI()
