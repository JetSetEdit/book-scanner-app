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
      // For now, we'll use a mock implementation
      // In a real implementation, you'd scrape StoryGraph or use their API
      console.log(`[StoryGraph] Searching for: ${query}`)
      
      // Mock data for testing
      const mockResults: StoryGraphBook[] = [
        {
          title: "When the Moon Hatched",
          authors: ["Sarah A. Parker"],
          pages: "400",
          first_pub: "2024",
          tags: ["fantasy", "romance", "adventure", "magic"],
          average_rating: "4.2",
          description: "A fantasy romance novel about magic and adventure.",
          warnings: {
            graphic: ["Violence", "Sexual Content"],
            moderate: ["Death", "War"],
            minor: ["Language"]
          },
          book_id: "fbdd6b7c-f512-47f2-aa94-d8bf0d5f5175",
          isbn: "9780008710262",
          cover_url: "https://images.storygraph.com/covers/123456.jpg"
        }
      ]

      return {
        success: true,
        data: mockResults
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
      
      // Mock data for testing
      const mockBook: StoryGraphBook = {
        title: "When the Moon Hatched",
        authors: ["Sarah A. Parker"],
        pages: "400",
        first_pub: "2024",
        tags: ["fantasy", "romance", "adventure", "magic"],
        average_rating: "4.2",
        description: "A fantasy romance novel about magic and adventure.",
        warnings: {
          graphic: ["Violence", "Sexual Content"],
          moderate: ["Death", "War"],
          minor: ["Language"]
        },
        book_id: bookId,
        isbn: "9780008710262",
        cover_url: "https://images.storygraph.com/covers/123456.jpg"
      }

      return {
        success: true,
        data: mockBook
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
      
      // For now, return mock data
      // In a real implementation, you'd search StoryGraph by ISBN
      if (cleanISBN === '9780008710262') {
        const mockBook: StoryGraphBook = {
          title: "When the Moon Hatched",
          authors: ["Sarah A. Parker"],
          pages: "400",
          first_pub: "2024",
          tags: ["fantasy", "romance", "adventure", "magic"],
          average_rating: "4.2",
          description: "A fantasy romance novel about magic and adventure.",
          warnings: {
            graphic: ["Violence", "Sexual Content"],
            moderate: ["Death", "War"],
            minor: ["Language"]
          },
          book_id: "fbdd6b7c-f512-47f2-aa94-d8bf0d5f5175",
          isbn: cleanISBN,
          cover_url: "https://images.storygraph.com/covers/123456.jpg"
        }

        return {
          success: true,
          data: mockBook
        }
      }

      return {
        success: false,
        error: 'Book not found with this ISBN'
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
