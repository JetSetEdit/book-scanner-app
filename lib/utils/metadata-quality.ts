export type MetadataQuality = 'thin' | 'moderate' | 'rich'

export type MetadataConfidence = 'low' | 'high'

export type MetadataQualityAssessment = {
  descriptionLength: number
  quality: MetadataQuality
  requiresEnrichment: boolean
  confidence: MetadataConfidence
}

type HasMetadataFields = {
  description?: string | null
  categories?: string[] | null
  author?: string | null
}

export function assessMetadataQuality(book: HasMetadataFields): MetadataQualityAssessment {
  const description = book.description || ''
  const descriptionLength = description.length
  const categoriesCount = book.categories?.length || 0
  const hasAuthor = !!(book.author && book.author.trim().length > 0)

  const THIN_THRESHOLD = 200
  const RICH_THRESHOLD = 500

  const quality: MetadataQuality =
    descriptionLength < THIN_THRESHOLD ? 'thin' : descriptionLength < RICH_THRESHOLD ? 'moderate' : 'rich'

  const requiresEnrichment = descriptionLength < THIN_THRESHOLD

  // Keep this intentionally simple: confidence is "high" only when we have a strong description
  // and at least one additional corroborating signal (categories).
  const confidence: MetadataConfidence =
    descriptionLength >= RICH_THRESHOLD && categoriesCount > 0 ? 'high' : 'low'

  // (hasAuthor is currently unused, but keep it as a future signal)
  void hasAuthor

  return {
    descriptionLength,
    quality,
    requiresEnrichment,
    confidence,
  }
}


