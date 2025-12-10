"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, Loader2, Brain, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Category {
  id: string
  weight: number
  label: string
}

export default function RLHFCategoriesPage() {
  const router = useRouter()
  const [categoryA, setCategoryA] = useState<Category | null>(null)
  const [categoryB, setCategoryB] = useState<Category | null>(null)
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
    fetchCategories()
  }

  const fetchCategories = async () => {
    setLoading(true)
    setResult(null)
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
      setLoading(false)
    }
  }

  const submitChoice = async (choice: 'A' | 'B' | 'equal') => {
    if (!categoryA || !categoryB) return

    setSubmitting(true)
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
        setResult({ userChoice: choice })
        setComparisonsCount(prev => prev + 1)
        
        // Load new categories after 1.5 seconds
        setTimeout(() => {
          fetchCategories()
        }, 1500)
      }
    } catch (error) {
      console.error('Failed to submit choice:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // Removed - fetchCategories is called from checkAuth

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

  if (!categoryA || !categoryB) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-slate-600">Failed to load categories. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Brain className="h-8 w-8" />
          Compare Warning Categories
        </h1>
        <p className="text-slate-600">
          Which warning category do you think is MORE SEVERE? 
          This helps us adjust the scoring weights.
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
                  You chose: {result.userChoice === 'A' ? categoryA.label : result.userChoice === 'B' ? categoryB.label : 'Equal'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Category A */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Category A</CardTitle>
            <CardDescription className="text-lg font-semibold mt-2">
              {categoryA.label}
            </CardDescription>
            <Badge variant="outline" className="mt-2 w-fit">
              Current Weight: {categoryA.weight}x
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              This category includes warnings about {categoryA.label.toLowerCase()}.
              When present, it's currently weighted {categoryA.weight}x in severity calculations.
            </p>
          </CardContent>
        </Card>

        {/* Category B */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Category B</CardTitle>
            <CardDescription className="text-lg font-semibold mt-2">
              {categoryB.label}
            </CardDescription>
            <Badge variant="outline" className="mt-2 w-fit">
              Current Weight: {categoryB.weight}x
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              This category includes warnings about {categoryB.label.toLowerCase()}.
              When present, it's currently weighted {categoryB.weight}x in severity calculations.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Choice Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Which category is MORE SEVERE?</CardTitle>
          <CardDescription>
            Consider: Which would be more concerning to a reader? Which deserves higher weight in scoring?
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
                  Category A is More Severe
                  <br />
                  <span className="text-xs font-normal opacity-70">
                    ({categoryA.label})
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
                  Category B is More Severe
                  <br />
                  <span className="text-xs font-normal opacity-70">
                    ({categoryB.label})
                  </span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <Button
          onClick={fetchCategories}
          variant="ghost"
          disabled={loading || submitting}
        >
          Skip & Get New Categories
        </Button>
      </div>

      <div className="mt-8 p-4 bg-slate-50 rounded-lg">
        <p className="text-sm text-slate-600">
          <strong>How this works:</strong> Your choices help us adjust category weights. 
          If you consistently say "Mental Health" is worse than "Language", we'll increase 
          the mental health weight and decrease the language weight in the scoring formula.
        </p>
      </div>
    </div>
  )
}

