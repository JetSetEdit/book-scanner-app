"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle2, Loader2, Lock, BookOpen, Brain, FileText, BarChart3 } from "lucide-react"
import { SeverityMild, SeverityModerate, SeveritySevere } from "@/components/severity-icons"
import { createClient } from "@/lib/supabase/client"

// Book comparison types
interface Book {
  id: string
  title: string
  author: string
  isbn: string
  score: number
  warnings: Array<{
    severity: string
    category_id: string
    description: string
  }>
}

interface Category {
  id: string
  weight: number
  label: string
}

interface WarningExample {
  id: string
  severity: string
  category: string
  description: string
  book: {
    title: string
    author: string
    isbn: string
  }
}

type ComparisonType = 'books' | 'categories' | 'examples'

export default function RLHFPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ComparisonType>('books')
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  
  // Book comparison state
  const [bookA, setBookA] = useState<Book | null>(null)
  const [bookB, setBookB] = useState<Book | null>(null)
  const [bookLoading, setBookLoading] = useState(false)
  const [bookSubmitting, setBookSubmitting] = useState(false)
  const [bookResult, setBookResult] = useState<any>(null)
  
  // Category comparison state
  const [categoryA, setCategoryA] = useState<Category | null>(null)
  const [categoryB, setCategoryB] = useState<Category | null>(null)
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [categorySubmitting, setCategorySubmitting] = useState(false)
  const [categoryResult, setCategoryResult] = useState<any>(null)
  
  // Example comparison state
  const [warningA, setWarningA] = useState<WarningExample | null>(null)
  const [warningB, setWarningB] = useState<WarningExample | null>(null)
  const [exampleLoading, setExampleLoading] = useState(false)
  const [exampleSubmitting, setExampleSubmitting] = useState(false)
  const [exampleResult, setExampleResult] = useState<any>(null)
  
  const [comparisonsCount, setComparisonsCount] = useState(0)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (authenticated) {
      // Load initial data based on active tab
      if (activeTab === 'books') fetchBooks()
      else if (activeTab === 'categories') fetchCategories()
      else if (activeTab === 'examples') fetchExamples()
    }
  }, [authenticated, activeTab])

  const checkAuth = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // Allow in dev mode (localhost)
    const isDev = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    )
    
    if (!user && !isDev) {
      setAuthenticated(false)
      return
    }
    
    setAuthenticated(true)
  }

  // Book comparison functions
  const fetchBooks = async () => {
    setBookLoading(true)
    setBookResult(null)
    try {
      const response = await fetch('/api/rlhf/compare')
      const data = await response.json()
      if (data.success) {
        setBookA(data.bookA)
        setBookB(data.bookB)
      }
    } catch (error) {
      console.error('Failed to fetch books:', error)
    } finally {
      setBookLoading(false)
    }
  }

  const submitBookChoice = async (choice: 'A' | 'B' | 'equal') => {
    if (!bookA || !bookB) return
    setBookSubmitting(true)
    try {
      const response = await fetch('/api/rlhf/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookAId: bookA.id,
          bookBId: bookB.id,
          userChoice: choice
        })
      })
      const data = await response.json()
      if (data.success) {
        setBookResult({ match: data.match, systemPrediction: data.systemPrediction, userChoice: choice })
        setComparisonsCount(prev => prev + 1)
        setTimeout(() => fetchBooks(), 2000)
      }
    } catch (error) {
      console.error('Failed to submit choice:', error)
    } finally {
      setBookSubmitting(false)
    }
  }

  // Category comparison functions
  const fetchCategories = async () => {
    setCategoryLoading(true)
    setCategoryResult(null)
    try {
      const response = await fetch('/api/rlhf/categories')
      const data = await response.json()
      if (data.success) {
        setCategoryA(data.categoryA)
        setCategoryB(data.categoryB)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setCategoryLoading(false)
    }
  }

  const submitCategoryChoice = async (choice: 'A' | 'B' | 'equal') => {
    if (!categoryA || !categoryB) return
    setCategorySubmitting(true)
    try {
      const response = await fetch('/api/rlhf/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryA: categoryA.id,
          categoryB: categoryB.id,
          userChoice: choice
        })
      })
      const data = await response.json()
      if (data.success) {
        setCategoryResult({ userChoice: choice })
        setComparisonsCount(prev => prev + 1)
        setTimeout(() => fetchCategories(), 1500)
      }
    } catch (error) {
      console.error('Failed to submit choice:', error)
    } finally {
      setCategorySubmitting(false)
    }
  }

  // Example comparison functions
  const fetchExamples = async () => {
    setExampleLoading(true)
    setExampleResult(null)
    try {
      const response = await fetch('/api/rlhf/examples')
      const data = await response.json()
      if (data.success) {
        setWarningA(data.warningA)
        setWarningB(data.warningB)
      }
    } catch (error) {
      console.error('Failed to fetch examples:', error)
    } finally {
      setExampleLoading(false)
    }
  }

  const submitExampleChoice = async (choice: 'A' | 'B' | 'equal') => {
    if (!warningA || !warningB) return
    setExampleSubmitting(true)
    try {
      const response = await fetch('/api/rlhf/examples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warningAId: warningA.id,
          warningBId: warningB.id,
          userChoice: choice
        })
      })
      const data = await response.json()
      if (data.success) {
        setExampleResult({ userChoice: choice })
        setComparisonsCount(prev => prev + 1)
        setTimeout(() => fetchExamples(), 1500)
      }
    } catch (error) {
      console.error('Failed to submit choice:', error)
    } finally {
      setExampleSubmitting(false)
    }
  }

  const getSeverityIcon = (severity: string) => {
    if (severity === 'severe') return <SeveritySevere className="h-4 w-4" />
    if (severity === 'moderate') return <SeverityModerate className="h-4 w-4" />
    return <SeverityMild className="h-4 w-4" />
  }

  const getSeverityBadgeVariant = (severity: string) => {
    if (severity === 'severe') return 'destructive'
    if (severity === 'moderate') return 'default'
    return 'secondary'
  }

  const formatCategoryLabel = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (authenticated === null) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </div>
    )
  }

  if (authenticated === false) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Authentication Required
            </CardTitle>
            <CardDescription>
              This page requires authentication to prevent spam and ensure quality feedback.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Brain className="h-8 w-8" />
          Help Improve Severity Scoring
        </h1>
        <p className="text-slate-600">
          Your feedback helps train our scoring system. Choose a comparison type below.
        </p>
        {comparisonsCount > 0 && (
          <p className="text-sm text-slate-500 mt-2">
            ✅ You've completed {comparisonsCount} comparison{comparisonsCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ComparisonType)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="books" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Books
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="examples" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Examples
          </TabsTrigger>
        </TabsList>

        {/* Books Tab */}
        <TabsContent value="books" className="mt-6">
          {bookResult && (
            <Card className="mb-6 border-2">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  {bookResult.match ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-600">Match!</p>
                        <p className="text-sm text-slate-600">
                          You and the system both chose {bookResult.userChoice === 'A' ? 'Book A' : bookResult.userChoice === 'B' ? 'Book B' : 'Equal'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="font-semibold text-amber-600">Different Opinion</p>
                        <p className="text-sm text-slate-600">
                          You chose {bookResult.userChoice === 'A' ? 'Book A' : bookResult.userChoice === 'B' ? 'Book B' : 'Equal'}, 
                          but system predicted {bookResult.systemPrediction === 'A' ? 'Book A' : bookResult.systemPrediction === 'B' ? 'Book B' : 'Equal'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {bookLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : bookA && bookB ? (
            <>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Book A</CardTitle>
                    <CardDescription>{bookA.title}</CardDescription>
                    <p className="text-sm text-slate-600 mt-1">by {bookA.author}</p>
                    <Badge variant="outline" className="mt-2 w-fit">Score: {bookA.score.toFixed(1)}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">
                        Content Warnings ({bookA.warnings.length}):
                      </div>
                      {bookA.warnings.map((w: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          {getSeverityIcon(w.severity)}
                          <div className="flex-1">
                            <Badge variant={getSeverityBadgeVariant(w.severity)} className="mb-1">
                              {w.severity.toUpperCase()}
                            </Badge>
                            <p className="text-slate-600 mt-1">{w.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Book B</CardTitle>
                    <CardDescription>{bookB.title}</CardDescription>
                    <p className="text-sm text-slate-600 mt-1">by {bookB.author}</p>
                    <Badge variant="outline" className="mt-2 w-fit">Score: {bookB.score.toFixed(1)}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm font-semibold text-slate-700 mb-2">
                        Content Warnings ({bookB.warnings.length}):
                      </div>
                      {bookB.warnings.map((w: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          {getSeverityIcon(w.severity)}
                          <div className="flex-1">
                            <Badge variant={getSeverityBadgeVariant(w.severity)} className="mb-1">
                              {w.severity.toUpperCase()}
                            </Badge>
                            <p className="text-slate-600 mt-1">{w.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Which book is MORE SEVERE?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={() => submitBookChoice('A')} disabled={bookSubmitting} className="flex-1 h-16 text-lg" variant="outline">
                      {bookSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Book A is More Severe<br /><span className="text-xs font-normal opacity-70">({bookA.title})</span></>}
                    </Button>
                    <Button onClick={() => submitBookChoice('equal')} disabled={bookSubmitting} className="flex-1 h-16 text-lg" variant="outline">
                      {bookSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'They Are Equally Severe'}
                    </Button>
                    <Button onClick={() => submitBookChoice('B')} disabled={bookSubmitting} className="flex-1 h-16 text-lg" variant="outline">
                      {bookSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Book B is More Severe<br /><span className="text-xs font-normal opacity-70">({bookB.title})</span></>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-slate-600">Failed to load books. <Button variant="ghost" onClick={fetchBooks}>Try again</Button></p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="mt-6">
          {categoryResult && (
            <Card className="mb-6 border-2 border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-600">Choice Saved!</p>
                    <p className="text-sm text-slate-600">
                      You chose: {categoryResult.userChoice === 'A' ? categoryA?.label : categoryResult.userChoice === 'B' ? categoryB?.label : 'Equal'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {categoryLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : categoryA && categoryB ? (
            <>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle>Category A</CardTitle>
                    <CardDescription className="text-lg font-semibold mt-2">{categoryA.label}</CardDescription>
                    <Badge variant="outline" className="mt-2 w-fit">Current Weight: {categoryA.weight}x</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">
                      This category includes warnings about {categoryA.label.toLowerCase()}.
                      When present, it's currently weighted {categoryA.weight}x in severity calculations.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader>
                    <CardTitle>Category B</CardTitle>
                    <CardDescription className="text-lg font-semibold mt-2">{categoryB.label}</CardDescription>
                    <Badge variant="outline" className="mt-2 w-fit">Current Weight: {categoryB.weight}x</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">
                      This category includes warnings about {categoryB.label.toLowerCase()}.
                      When present, it's currently weighted {categoryB.weight}x in severity calculations.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Which category is MORE SEVERE?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={() => submitCategoryChoice('A')} disabled={categorySubmitting} className="flex-1 h-16 text-lg" variant="outline">
                      {categorySubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Category A is More Severe<br /><span className="text-xs font-normal opacity-70">({categoryA.label})</span></>}
                    </Button>
                    <Button onClick={() => submitCategoryChoice('equal')} disabled={categorySubmitting} className="flex-1 h-16 text-lg" variant="outline">
                      {categorySubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'They Are Equally Severe'}
                    </Button>
                    <Button onClick={() => submitCategoryChoice('B')} disabled={categorySubmitting} className="flex-1 h-16 text-lg" variant="outline">
                      {categorySubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Category B is More Severe<br /><span className="text-xs font-normal opacity-70">({categoryB.label})</span></>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-slate-600">Failed to load categories. <Button variant="ghost" onClick={fetchCategories}>Try again</Button></p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Examples Tab */}
        <TabsContent value="examples" className="mt-6">
          {exampleResult && (
            <Card className="mb-6 border-2 border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-600">Choice Saved!</p>
                    <p className="text-sm text-slate-600">
                      You chose: {exampleResult.userChoice === 'A' ? 'Example A' : exampleResult.userChoice === 'B' ? 'Example B' : 'Equal'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {exampleLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : warningA && warningB ? (
            <>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle>Example A</CardTitle>
                    <CardDescription className="mt-2">
                      <div className="flex items-center gap-2 mb-2">
                        {getSeverityIcon(warningA.severity)}
                        <Badge variant={getSeverityBadgeVariant(warningA.severity)}>{warningA.severity.toUpperCase()}</Badge>
                        <Badge variant="outline">{formatCategoryLabel(warningA.category)}</Badge>
                      </div>
                      <div className="text-sm font-semibold text-slate-700 mt-2">{warningA.book.title}</div>
                      <div className="text-xs text-slate-500">by {warningA.book.author}</div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-slate-300">
                      <p className="text-sm text-slate-700 italic">"{warningA.description}"</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader>
                    <CardTitle>Example B</CardTitle>
                    <CardDescription className="mt-2">
                      <div className="flex items-center gap-2 mb-2">
                        {getSeverityIcon(warningB.severity)}
                        <Badge variant={getSeverityBadgeVariant(warningB.severity)}>{warningB.severity.toUpperCase()}</Badge>
                        <Badge variant="outline">{formatCategoryLabel(warningB.category)}</Badge>
                      </div>
                      <div className="text-sm font-semibold text-slate-700 mt-2">{warningB.book.title}</div>
                      <div className="text-xs text-slate-500">by {warningB.book.author}</div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-slate-300">
                      <p className="text-sm text-slate-700 italic">"{warningB.description}"</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Which example is MORE SEVERE?</CardTitle>
                  <CardDescription>
                    Consider the actual content described, not just the category or current severity label.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={() => submitExampleChoice('A')} disabled={exampleSubmitting} className="flex-1 h-16 text-lg" variant="outline">
                      {exampleSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Example A is More Severe<br /><span className="text-xs font-normal opacity-70">({warningA.book.title})</span></>}
                    </Button>
                    <Button onClick={() => submitExampleChoice('equal')} disabled={exampleSubmitting} className="flex-1 h-16 text-lg" variant="outline">
                      {exampleSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'They Are Equally Severe'}
                    </Button>
                    <Button onClick={() => submitExampleChoice('B')} disabled={exampleSubmitting} className="flex-1 h-16 text-lg" variant="outline">
                      {exampleSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Example B is More Severe<br /><span className="text-xs font-normal opacity-70">({warningB.book.title})</span></>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-slate-600">Failed to load examples. <Button variant="ghost" onClick={fetchExamples}>Try again</Button></p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
