'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BookOpen, CheckCircle, AlertCircle } from 'lucide-react'

interface Book {
  isbn: string
  title: string
  author: string
  current_cover_url: string
}

interface CoverOption {
  filename: string
  url: string
  size_kb: number
  source: string
}

export default function SelectCoversPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [coverOptions, setCoverOptions] = useState<Record<string, CoverOption[]>>({})
  const [selectedCovers, setSelectedCovers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchBooks()
    fetchCoverOptions()
  }, [])

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/update-correct-covers')
      const data = await response.json()
      setBooks(data.books || [])
    } catch (error) {
      console.error('Error fetching books:', error)
    }
  }

  const fetchCoverOptions = async () => {
    try {
      // Get list of all cover files
      const response = await fetch('/api/get-cover-options')
      const data = await response.json()
      setCoverOptions(data.coverOptions || {})
      
      // Initialize selected covers with current ones
      const initialSelections: Record<string, string> = {}
      books.forEach(book => {
        if (book.current_cover_url) {
          const filename = book.current_cover_url.split('/').pop()
          if (filename) {
            initialSelections[book.isbn] = filename
          }
        }
      })
      setSelectedCovers(initialSelections)
    } catch (error) {
      console.error('Error fetching cover options:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCoverSelect = (isbn: string, filename: string) => {
    setSelectedCovers(prev => ({
      ...prev,
      [isbn]: filename
    }))
  }

  const saveSelectedCovers = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/update-selected-covers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedCovers }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: `Successfully updated ${data.updatedCount} book covers!` })
        // Refresh books to show updated covers
        await fetchBooks()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update covers' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error updating covers' })
    } finally {
      setSaving(false)
    }
  }

  const getFileSizeColor = (sizeKB: number) => {
    if (sizeKB > 20) return 'text-green-600'
    if (sizeKB > 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getFileSizeBadge = (sizeKB: number) => {
    if (sizeKB > 20) return 'bg-green-100 text-green-800'
    if (sizeKB > 10) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Loading cover options...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Select Book Covers</h1>
          <p className="text-muted-foreground">
            Choose the best cover image for each book. Larger file sizes typically indicate better quality.
          </p>
        </div>

        {message && (
          <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {books.map((book) => {
            const options = coverOptions[book.isbn] || []
            const selectedCover = selectedCovers[book.isbn]

            return (
              <Card key={book.isbn}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {book.title}
                  </CardTitle>
                  <CardDescription>
                    by {book.author} • ISBN: {book.isbn}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {options.map((option) => {
                      const isSelected = selectedCover === option.filename
                      
                      return (
                        <div
                          key={option.filename}
                          className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary/5' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleCoverSelect(book.isbn, option.filename)}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <CheckCircle className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          
                          <div className="aspect-[3/4] bg-gray-100 rounded mb-3 overflow-hidden">
                            <img
                              src={option.url}
                              alt={`${book.title} cover`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {option.source}
                              </Badge>
                              <span className={`text-sm font-medium ${getFileSizeColor(option.size_kb)}`}>
                                {option.size_kb}KB
                              </span>
                            </div>
                            
                            <div className="text-xs text-muted-foreground">
                              {option.filename}
                            </div>
                            
                            <Badge 
                              className={`text-xs ${getFileSizeBadge(option.size_kb)}`}
                            >
                              {option.size_kb > 20 ? 'High Quality' : 
                               option.size_kb > 10 ? 'Medium Quality' : 'Low Quality'}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {options.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No cover options found for this book
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <Button 
            onClick={saveSelectedCovers}
            disabled={saving}
            size="lg"
            className="px-8"
          >
            {saving ? 'Saving...' : 'Save Selected Covers'}
          </Button>
        </div>
      </div>
    </div>
  )
}
