"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, ExternalLink, Info } from "lucide-react"

interface StoryGraphDataProps {
  book: {
    storygraph_rating?: number
    categories?: string[]
    description?: string
  }
  warnings: Array<{
    id: string
    category: string
    description: string
    severity: string
  }>
}

export function StoryGraphData({ book, warnings }: StoryGraphDataProps) {
  // Check if we have any StoryGraph data
  const hasStoryGraphData = book.storygraph_rating || 
    (book.categories && book.categories.length > 0) || 
    warnings.length > 0

  if (!hasStoryGraphData) {
    return null
  }

  const storyGraphWarnings = warnings.filter(w => 
    w.description.includes('StoryGraph') || 
    w.category.includes('storygraph')
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-600" />
          StoryGraph Data
        </CardTitle>
        <CardDescription>
          Additional book information from StoryGraph community
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* StoryGraph Rating */}
        {book.storygraph_rating && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">Community Rating:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-yellow-600">
                {book.storygraph_rating.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">/5.0</span>
              <Badge variant="outline" className="text-xs">
                StoryGraph
              </Badge>
            </div>
          </div>
        )}

        {/* StoryGraph Tags/Categories */}
        {book.categories && book.categories.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Community Tags:</h4>
            <div className="flex flex-wrap gap-2">
              {book.categories.map((category, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* StoryGraph Content Warnings */}
        {storyGraphWarnings.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Community Content Warnings:</h4>
            <div className="space-y-2">
              {storyGraphWarnings.map((warning) => (
                <div key={warning.id} className="flex items-start gap-2 p-2 bg-muted/50 rounded-md">
                  <Badge 
                    variant={warning.severity === 'severe' ? 'destructive' : 
                            warning.severity === 'moderate' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {warning.severity}
                  </Badge>
                  <span className="text-sm">{warning.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Link to StoryGraph */}
        <div className="pt-2 border-t">
          <a
            href={`https://app.thestorygraph.com/books/${book.title.replace(/\s+/g, '-').toLowerCase()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            View on StoryGraph
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
