"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink, Package } from "lucide-react"
import { useRouter } from "next/navigation"

interface ProductDetailsProps {
  product: {
    barcode: string
    name: string
    brand?: string
    category?: string
    image_url?: string
    description?: string
    source: 'openfoodfacts' | 'upcitemdb' | 'barcodelookup'
  }
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const router = useRouter()

  const handleBack = () => {
    router.push('/')
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'openfoodfacts': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'upcitemdb': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'barcodelookup': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getSourceName = (source: string) => {
    switch (source) {
      case 'openfoodfacts': return 'Open Food Facts'
      case 'upcitemdb': return 'UPC Database'
      case 'barcodelookup': return 'Barcode Lookup'
      default: return 'Unknown'
    }
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button 
        variant="outline" 
        onClick={handleBack}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Product Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Details
          </CardTitle>
          <CardDescription>
            Barcode: {product.barcode}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            {/* Product Image */}
            {product.image_url && (
              <div className="flex-shrink-0">
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-32 h-32 object-cover rounded-lg border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}

            {/* Product Info */}
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="text-xl font-semibold">{product.name}</h2>
                {product.brand && (
                  <p className="text-muted-foreground">Brand: {product.brand}</p>
                )}
              </div>

              {product.description && (
                <p className="text-sm text-muted-foreground">{product.description}</p>
              )}

              <div className="flex flex-wrap gap-2">
                {product.category && (
                  <Badge variant="outline">{product.category}</Badge>
                )}
                <Badge variant="secondary" className={getSourceColor(product.source)}>
                  {getSourceName(product.source)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" size="sm" asChild>
              <a 
                href={`https://www.google.com/search?q=${encodeURIComponent(product.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Search Google
              </a>
            </Button>
            
            {product.source === 'openfoodfacts' && (
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={`https://world.openfoodfacts.org/product/${product.barcode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View on Open Food Facts
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
