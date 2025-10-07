"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AustralianClassification } from "@/components/australian-classification"
import { Shield, CheckCircle, AlertCircle } from "lucide-react"

const classificationRatings = [
  { value: "G", label: "G - General", description: "Content is very mild in impact" },
  { value: "PG", label: "PG - Parental Guidance", description: "Content is mild in impact" },
  { value: "M", label: "M - Mature", description: "Content is moderate in impact" },
  { value: "MA15+", label: "MA 15+ - Mature Accompanied", description: "Content is strong in impact" },
  { value: "R18+", label: "R 18+ - Restricted", description: "Content is high in impact" },
  { value: "X18+", label: "X 18+ - Restricted", description: "Sexually explicit content" },
]

export default function AdminClassificationPage() {
  const [isbn, setIsbn] = useState("")
  const [classification, setClassification] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isbn || !classification) return

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/add-classification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isbn,
          classification_rating: classification,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: data.message })
        setIsbn("")
        setClassification("")
      } else {
        setResult({ success: false, message: data.error })
      }
    } catch (error) {
      setResult({ success: false, message: 'Failed to update classification' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
            <Shield className="h-8 w-8" />
            Add Classification Ratings
          </h1>
          <p className="text-muted-foreground">
            Add Australian Classification Board ratings to books in your collection
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add Classification Rating</CardTitle>
            <CardDescription>
              Enter the ISBN and select the appropriate classification rating
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  type="text"
                  placeholder="9780008710262"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="classification">Classification Rating</Label>
                <Select value={classification} onValueChange={setClassification} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a classification rating" />
                  </SelectTrigger>
                  <SelectContent>
                    {classificationRatings.map((rating) => (
                      <SelectItem key={rating.value} value={rating.value}>
                        <div className="flex items-center gap-2">
                          <AustralianClassification rating={rating.value as any} size="sm" />
                          <div>
                            <div className="font-medium">{rating.label}</div>
                            <div className="text-xs text-muted-foreground">{rating.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Adding Classification..." : "Add Classification Rating"}
              </Button>
            </form>

            {result && (
              <div className={`mt-4 p-4 rounded-lg flex items-center gap-2 ${
                result.success 
                  ? "bg-green-50 text-green-800 border border-green-200" 
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}>
                {result.success ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span>{result.message}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Available Classification Ratings</CardTitle>
            <CardDescription>
              Official Australian Classification Board ratings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classificationRatings.map((rating) => (
                <div key={rating.value} className="flex items-center gap-3 p-3 border rounded-lg">
                  <AustralianClassification rating={rating.value as any} size="md" />
                  <div>
                    <div className="font-medium">{rating.label}</div>
                    <div className="text-sm text-muted-foreground">{rating.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
