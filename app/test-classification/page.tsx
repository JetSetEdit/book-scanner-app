import { AustralianClassification } from "@/components/australian-classification"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestClassificationPage() {
  const ratings = ["G", "PG", "M", "MA15+", "R18+", "X18+"] as const

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Australian Classification Board Symbols</h1>
          <p className="text-muted-foreground">
            Test page for displaying Australian classification ratings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ratings.map((rating) => (
            <Card key={rating}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <AustralianClassification rating={rating} size="md" />
                  <span>{rating}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AustralianClassification 
                  rating={rating} 
                  size="lg" 
                  showLabel={true}
                  className="justify-center"
                />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Different Sizes</h2>
          <div className="space-y-4">
            {ratings.slice(0, 3).map((rating) => (
              <div key={rating} className="flex items-center gap-4">
                <span className="w-20 text-sm font-medium">{rating}:</span>
                <AustralianClassification rating={rating} size="sm" />
                <AustralianClassification rating={rating} size="md" />
                <AustralianClassification rating={rating} size="lg" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Usage in Book Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="w-20 h-32 bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Book Cover</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-bold text-lg">Sample Book Title</h3>
                    <p className="text-sm text-muted-foreground">by Author Name</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Classification:</span>
                      <AustralianClassification rating="M" size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This book has been classified as M (Mature) by the Australian Classification Board.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="w-20 h-32 bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Book Cover</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-bold text-lg">Another Book Title</h3>
                    <p className="text-sm text-muted-foreground">by Another Author</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Classification:</span>
                      <AustralianClassification rating="MA15+" size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This book has been classified as MA 15+ (Mature Accompanied) by the Australian Classification Board.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
