import { ProductDetails } from "@/components/product-details"
import { lookupProductByBarcode } from "@/lib/product-api"
import { notFound } from "next/navigation"

interface ProductPageProps {
  params: Promise<{
    barcode: string
  }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { barcode } = await params

  // Look up the product
  const product = await lookupProductByBarcode(barcode)

  if (!product) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <ProductDetails product={product} />
        </div>
      </div>
    </main>
  )
}
