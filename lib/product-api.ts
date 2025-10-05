interface ProductData {
  barcode: string
  name: string
  brand?: string
  category?: string
  image_url?: string
  description?: string
  source: 'openfoodfacts' | 'upcitemdb' | 'barcodelookup'
}

export async function lookupProductByBarcode(barcode: string): Promise<ProductData | null> {
  // Try Open Food Facts first (free and comprehensive)
  try {
    const openFoodFactsResult = await lookupOpenFoodFacts(barcode)
    if (openFoodFactsResult) return openFoodFactsResult
  } catch (error) {
    console.log('[v0] Open Food Facts lookup failed:', error)
  }

  // Try UPC Database as fallback
  try {
    const upcResult = await lookupUPCDatabase(barcode)
    if (upcResult) return upcResult
  } catch (error) {
    console.log('[v0] UPC Database lookup failed:', error)
  }

  return null
}

async function lookupOpenFoodFacts(barcode: string): Promise<ProductData | null> {
  const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`, {
    next: { revalidate: 86400 } // Cache for 24 hours
  })

  if (!response.ok) return null

  const data = await response.json()
  
  if (data.status === 0 || !data.product) return null

  const product = data.product

  return {
    barcode: barcode,
    name: product.product_name || product.product_name_en || 'Unknown Product',
    brand: product.brands || product.brand_owner,
    category: product.categories || product.categories_en,
    image_url: product.image_url || product.image_front_url,
    description: product.generic_name || product.generic_name_en,
    source: 'openfoodfacts'
  }
}

async function lookupUPCDatabase(barcode: string): Promise<ProductData | null> {
  const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`, {
    next: { revalidate: 86400 } // Cache for 24 hours
  })

  if (!response.ok) return null

  const data = await response.json()
  
  if (data.code !== 'OK' || !data.items || data.items.length === 0) return null

  const item = data.items[0]

  return {
    barcode: barcode,
    name: item.title || 'Unknown Product',
    brand: item.brand,
    category: item.category,
    image_url: item.images?.[0],
    description: item.description,
    source: 'upcitemdb'
  }
}
