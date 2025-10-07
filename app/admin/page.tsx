'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BookOpen, Clock, CheckCircle, AlertTriangle, BarChart3, RefreshCw } from 'lucide-react'

interface Book {
  id: string
  isbn: string
  title: string
  author: string
  review_status: 'pending' | 'reviewed' | 'flagged' | 'complete'
  in_db: boolean
  has_author_warnings: boolean
  created_at: string
  last_checked: string | null
}

interface ScanStats {
  total_scans: number
  pending_books: number
  reviewed_books: number
  complete_books: number
  flagged_books: number
}

export default function AdminDashboard() {
  const [books, setBooks] = useState<Book[]>([])
  const [stats, setStats] = useState<ScanStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      setRefreshing(true)
      
      // Fetch pending books
      const booksResponse = await fetch('/api/admin/pending-books')
      const booksData = await booksResponse.json()
      setBooks(booksData.books || [])

      // Fetch statistics
      const statsResponse = await fetch('/api/admin/scan-statistics')
      const statsData = await statsResponse.json()
      setStats(statsData.stats || null)
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const markAsComplete = async (bookId: string) => {
    try {
      const response = await fetch('/api/admin/complete-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId })
      })
      
      if (response.ok) {
        await fetchData() // Refresh data
      }
    } catch (error) {
      console.error('Error marking book as complete:', error)
    }
  }

  const triggerMetadataFetch = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/fetch-metadata')
      const data = await response.json()
      
      if (data.success) {
        await fetchData() // Refresh data
        alert(`Metadata fetch completed. Processed ${data.processedIsbns?.length || 0} books.`)
      }
    } catch (error) {
      console.error('Error triggering metadata fetch:', error)
      alert('Error triggering metadata fetch')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'default',
      reviewed: 'secondary',
      flagged: 'destructive',
      complete: 'default'
    } as const

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
          <span className="ml-2">Loading admin dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage book reviews and scan statistics</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={triggerMetadataFetch} 
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Fetch Metadata
          </Button>
          <Button onClick={fetchData} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_scans}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending_books}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.reviewed_books}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Complete</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.complete_books}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flagged</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.flagged_books}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Review ({books.filter(b => b.review_status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="all">All Books ({books.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {books.filter(b => b.review_status === 'pending').length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                No books pending review. All caught up! 🎉
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {books.filter(b => b.review_status === 'pending').map((book) => (
                <Card key={book.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{book.title}</CardTitle>
                        <CardDescription>by {book.author}</CardDescription>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">ISBN: {book.isbn}</Badge>
                          {getStatusBadge(book.review_status)}
                          {book.has_author_warnings && (
                            <Badge variant="secondary">Has Author Warnings</Badge>
                          )}
                        </div>
                      </div>
                      <Button 
                        onClick={() => markAsComplete(book.id)}
                        size="sm"
                      >
                        Mark Complete
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      <p>Created: {new Date(book.created_at).toLocaleDateString()}</p>
                      {book.last_checked && (
                        <p>Last checked: {new Date(book.last_checked).toLocaleDateString()}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
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
                        {book.has_author_warnings && (
                          <Badge variant="secondary">Has Author Warnings</Badge>
                        )}
                        {book.in_db && (
                          <Badge variant="default">In Database</Badge>
                        )}
                      </div>
                    </div>
                    {book.review_status === 'pending' && (
                      <Button 
                        onClick={() => markAsComplete(book.id)}
                        size="sm"
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    <p>Created: {new Date(book.created_at).toLocaleDateString()}</p>
                    {book.last_checked && (
                      <p>Last checked: {new Date(book.last_checked).toLocaleDateString()}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

