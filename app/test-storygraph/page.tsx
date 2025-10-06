"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Search, AlertCircle } from "lucide-react"

export default function TestStoryGraphPage() {
  const [isbn, setIsbn] = useState("9780008710262")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testStoryGraph = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      // Test the book lookup which now includes StoryGraph integration
      const response = await fetch('/api/test-storygraph', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isbn }),
      })

      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        setResult(data)
      }
    } catch (err) {
      setError('Failed to test StoryGraph integration')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">StoryGraph Integration Test</h1>
          <p className="text-muted-foreground">
            Test the StoryGraph API integration for enhanced book data and content warnings
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Test ISBN Lookup
            </CardTitle>
            <CardDescription>
              Enter an ISBN to test the enhanced book lookup with StoryGraph data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="Enter ISBN (e.g., 9780008710262)"
                className="flex-1"
              />
              <Button onClick={testStoryGraph} disabled={isLoading}>
                {isLoading ? "Testing..." : "Test Lookup"}
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p><strong>Test ISBN:</strong> 9780008710262 (When the Moon Hatched)</p>
              <p>This will test both Open Library/Google Books and StoryGraph integration</p>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Book Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold">Basic Info</h3>
                    <p><strong>Title:</strong> {result.book?.title}</p>
                    <p><strong>Author:</strong> {result.book?.author}</p>
                    <p><strong>ISBN:</strong> {result.book?.isbn}</p>
                    <p><strong>Pages:</strong> {result.book?.page_count}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Enhanced Data</h3>
                    <p><strong>Categories:</strong> {result.book?.categories?.join(', ')}</p>
                    <p><strong>Publisher:</strong> {result.book?.publisher}</p>
                    <p><strong>Published:</strong> {result.book?.published_date}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {result.storyGraphData && (
              <Card>
                <CardHeader>
                  <CardTitle>StoryGraph Data</CardTitle>
                  <CardDescription>Enhanced data from StoryGraph</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold">Tags</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {result.storyGraphData.tags?.map((tag: string) => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold">Average Rating</h3>
                      <p>{result.storyGraphData.average_rating}/5</p>
                    </div>

                    {result.storyGraphData.warnings && (
                      <div>
                        <h3 className="font-semibold">Content Warnings</h3>
                        <div className="space-y-2 mt-2">
                          {result.storyGraphData.warnings.graphic && (
                            <div>
                              <Badge variant="destructive" className="mb-1">Graphic</Badge>
                              <div className="flex flex-wrap gap-1">
                                {result.storyGraphData.warnings.graphic.map((warning: string) => (
                                  <Badge key={warning} variant="outline" className="text-xs">{warning}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {result.storyGraphData.warnings.moderate && (
                            <div>
                              <Badge variant="default" className="mb-1">Moderate</Badge>
                              <div className="flex flex-wrap gap-1">
                                {result.storyGraphData.warnings.moderate.map((warning: string) => (
                                  <Badge key={warning} variant="outline" className="text-xs">{warning}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {result.storyGraphData.warnings.minor && (
                            <div>
                              <Badge variant="secondary" className="mb-1">Minor</Badge>
                              <div className="flex flex-wrap gap-1">
                                {result.storyGraphData.warnings.minor.map((warning: string) => (
                                  <Badge key={warning} variant="outline" className="text-xs">{warning}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {result.contentWarnings && result.contentWarnings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Database Content Warnings</CardTitle>
                  <CardDescription>Content warnings added to database</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {result.contentWarnings.map((warning: any) => (
                      <div key={warning.id} className="flex items-center gap-2 p-2 border rounded">
                        <Badge variant={warning.severity === 'severe' ? 'destructive' : warning.severity === 'moderate' ? 'default' : 'secondary'}>
                          {warning.severity}
                        </Badge>
                        <Badge variant="outline">{warning.category}</Badge>
                        <span className="text-sm">{warning.description}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
