'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Clock, CheckCircle, RefreshCw } from 'lucide-react'

interface SubmittedBook {
  id: string
  isbn: string
  title: string
  author: string
  review_status: 'pending' | 'reviewed' | 'flagged' | 'complete'
  created_at: string
  last_checked: string | null
}

export default function MySubmissions() {
  const [books, setBooks] = useState<SubmittedBook[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSubmissions = async () => {
    try {
      // For now, we'll show all pending books since we don't have user tracking
      // In the future, this could filter by user_id
      const response = await fetch('/api/admin/pending-books')
      const data = await response.json()
      setBooks(data.books || [])
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      flagged: 'bg-red-100 text-red-800',
      complete: 'bg-green-100 text-green-800'
    }

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading your submissions...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Book Submissions</h1>
          <p className="text-muted-foreground">Track the books you've submitted for review</p>
        </div>
        <Button onClick={fetchSubmissions} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {books.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
            <p className="text-muted-foreground text-center">
              Scan a book that's not in our database to see it appear here!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {books.map((book) => (
            <Card key={book.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{book.title}</CardTitle>
                    <CardDescription>by {book.author}</CardDescription>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">ISBN: {book.isbn}</Badge>
                      {getStatusBadge(book.review_status)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {book.review_status === 'pending' && (
                      <Clock className="h-4 w-4 text-yellow-600" />
                    )}
                    {book.review_status === 'complete' && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p>Submitted: {new Date(book.created_at).toLocaleDateString()}</p>
                  {book.last_checked && (
                    <p>Last updated: {new Date(book.last_checked).toLocaleDateString()}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
