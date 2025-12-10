"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, TrendingUp } from "lucide-react"

interface Comparison {
  id: string
  book_a_id: string
  book_b_id: string
  user_choice: string
  system_prediction: string
  book_a_score: number
  book_b_score: number
  match: boolean
  created_at: string
  book_a: { title: string; author: string }
  book_b: { title: string; author: string }
}

export default function RLHFAnalysisPage() {
  const [comparisons, setComparisons] = useState<Comparison[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    matches: 0,
    mismatches: 0,
    matchRate: 0
  })

  useEffect(() => {
    fetchComparisons()
  }, [])

  const fetchComparisons = async () => {
    try {
      const response = await fetch('/api/rlhf/analysis')
      const data = await response.json()
      if (data.success) {
        setComparisons(data.comparisons || [])
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error('Failed to fetch comparisons:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  const mismatches = comparisons.filter(c => !c.match)
  const matches = comparisons.filter(c => c.match)

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-2">RLHF Analysis</h1>
      <p className="text-slate-600 mb-8">
        Review your comparisons and see how they align with system predictions
      </p>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Comparisons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Match Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.matchRate.toFixed(1)}%
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {stats.matches} matches, {stats.mismatches} mismatches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mismatches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {stats.mismatches}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Most valuable for improvement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mismatches Section */}
      {mismatches.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Mismatches ({mismatches.length})
            </CardTitle>
            <CardDescription>
              Cases where your judgment differed from the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mismatches.map((comp) => (
                <div key={comp.id} className="border-l-4 border-amber-500 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold">
                        You chose: <Badge variant="outline">
                          {comp.user_choice === 'A' ? comp.book_a.title : 
                           comp.user_choice === 'B' ? comp.book_b.title : 'Equal'}
                        </Badge>
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        System predicted: <Badge variant="secondary">
                          {comp.system_prediction === 'A' ? comp.book_a.title : 
                           comp.system_prediction === 'B' ? comp.book_b.title : 'Equal'}
                        </Badge>
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Scores: {comp.book_a_score.toFixed(1)} vs {comp.book_b_score.toFixed(1)} 
                        (diff: {Math.abs(comp.book_a_score - comp.book_b_score).toFixed(1)})
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matches Section */}
      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Matches ({matches.length})
            </CardTitle>
            <CardDescription>
              Cases where your judgment aligned with the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {matches.map((comp) => (
                <div key={comp.id} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>
                    Both chose: <Badge variant="outline">
                      {comp.user_choice === 'A' ? comp.book_a.title : 
                       comp.user_choice === 'B' ? comp.book_b.title : 'Equal'}
                    </Badge>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {comparisons.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-slate-600">
              No comparisons yet. Start comparing books at <a href="/rlhf" className="text-blue-600 underline">/rlhf</a>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

