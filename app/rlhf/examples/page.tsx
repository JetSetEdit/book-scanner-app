"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Loader2, BookOpen, Lock } from "lucide-react"
import { SeverityMild, SeverityModerate, SeveritySevere } from "@/components/severity-icons"
import { createClient } from "@/lib/supabase/client"

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

export default function RLHFExamplesPage() {
  const router = useRouter()
  const [warningA, setWarningA] = useState<WarningExample | null>(null)
  const [warningB, setWarningB] = useState<WarningExample | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [result, setResult] = useState<{
    userChoice: string
  } | null>(null)
  const [comparisonsCount, setComparisonsCount] = useState(0)

  useEffect(() => {
    checkAuth()
  }, [])

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
    fetchExamples()
  }

  const fetchExamples = async () => {
    setLoading(true)
    setResult(null)
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
      setLoading(false)
    }
  }

  const submitChoice = async (choice: 'A' | 'B' | 'equal') => {
    if (!warningA || !warningB) return

    setSubmitting(true)
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
        setResult({ userChoice: choice })
        setComparisonsCount(prev => prev + 1)
        
        // Load new examples after 1.5 seconds
        setTimeout(() => {
          fetchExamples()
        }, 1500)
      }
    } catch (error) {
      console.error('Failed to submit choice:', error)
    } finally {
      setSubmitting(false)
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

  if (authenticated === null || loading) {
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

  if (!warningA || !warningB) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-slate-600">Failed to load examples. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          Compare Warning Examples
        </h1>
        <p className="text-slate-600">
          Which specific warning example is MORE SEVERE? 
          Compare the actual content, not just the category.
        </p>
        {comparisonsCount > 0 && (
          <p className="text-sm text-slate-500 mt-2">
            ✅ You've completed {comparisonsCount} comparison{comparisonsCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {result && (
        <Card className="mb-6 border-2 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-600">Choice Saved!</p>
                <p className="text-sm text-slate-600">
                  You chose: {result.userChoice === 'A' ? 'Example A' : result.userChoice === 'B' ? 'Example B' : 'Equal'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Example A */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Example A</CardTitle>
            <CardDescription className="mt-2">
              <div className="flex items-center gap-2 mb-2">
                {getSeverityIcon(warningA.severity)}
                <Badge variant={getSeverityBadgeVariant(warningA.severity)}>
                  {warningA.severity.toUpperCase()}
                </Badge>
                <Badge variant="outline">
                  {formatCategoryLabel(warningA.category)}
                </Badge>
              </div>
              <div className="text-sm font-semibold text-slate-700 mt-2">
                {warningA.book.title}
              </div>
              <div className="text-xs text-slate-500">
                by {warningA.book.author}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-slate-300">
              <p className="text-sm text-slate-700 italic">
                "{warningA.description}"
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Example B */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Example B</CardTitle>
            <CardDescription className="mt-2">
              <div className="flex items-center gap-2 mb-2">
                {getSeverityIcon(warningB.severity)}
                <Badge variant={getSeverityBadgeVariant(warningB.severity)}>
                  {warningB.severity.toUpperCase()}
                </Badge>
                <Badge variant="outline">
                  {formatCategoryLabel(warningB.category)}
                </Badge>
              </div>
              <div className="text-sm font-semibold text-slate-700 mt-2">
                {warningB.book.title}
              </div>
              <div className="text-xs text-slate-500">
                by {warningB.book.author}
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-slate-300">
              <p className="text-sm text-slate-700 italic">
                "{warningB.description}"
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Choice Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Which example is MORE SEVERE?</CardTitle>
          <CardDescription>
            Consider the actual content described, not just the category or current severity label.
            Think about which would be more concerning to a reader.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => submitChoice('A')}
              disabled={submitting}
              className="flex-1 h-16 text-lg"
              variant="outline"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Example A is More Severe
                  <br />
                  <span className="text-xs font-normal opacity-70">
                    ({warningA.book.title})
                  </span>
                </>
              )}
            </Button>

            <Button
              onClick={() => submitChoice('equal')}
              disabled={submitting}
              className="flex-1 h-16 text-lg"
              variant="outline"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'They Are Equally Severe'
              )}
            </Button>

            <Button
              onClick={() => submitChoice('B')}
              disabled={submitting}
              className="flex-1 h-16 text-lg"
              variant="outline"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Example B is More Severe
                  <br />
                  <span className="text-xs font-normal opacity-70">
                    ({warningB.book.title})
                  </span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <Button
          onClick={fetchExamples}
          variant="ghost"
          disabled={loading || submitting}
        >
          Skip & Get New Examples
        </Button>
      </div>

      <div className="mt-8 p-4 bg-slate-50 rounded-lg">
        <p className="text-sm text-slate-600">
          <strong>How this works:</strong> You're comparing actual warning examples from real books. 
          This helps us understand which specific content is more severe, regardless of category. 
          For example, "domestic violence: character slaps X" might be worse than "language: character says 'fuck'", 
          even though language warnings exist. Your feedback trains the system on real examples.
        </p>
      </div>
    </div>
  )
}

