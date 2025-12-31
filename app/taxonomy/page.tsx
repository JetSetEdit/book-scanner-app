"use client"

import { useState, useMemo } from 'react'
import { WARNING_CATEGORIES, TAXONOMY_VERSION, type WarningCategory, type WarningSubcategory } from '@/lib/config/taxonomy-v2'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight, Search, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

function SeverityBadge({ severity }: { severity?: 'mild' | 'moderate' | 'severe' }) {
  if (!severity) return null
  
  const variants = {
    mild: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    severe: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  }
  
  return (
    <Badge className={cn('text-xs font-medium', variants[severity])}>
      {severity}
    </Badge>
  )
}

function CategoryCard({ category, searchQuery }: { category: WarningCategory; searchQuery: string }) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Filter subcategories based on search
  const filteredSubcategories = useMemo(() => {
    if (!searchQuery) return category.subcategories
    
    const query = searchQuery.toLowerCase()
    return category.subcategories.filter(sub => 
      sub.userLabel.toLowerCase().includes(query) ||
      sub.shortDescription.toLowerCase().includes(query) ||
      sub.id.toLowerCase().includes(query)
    )
  }, [category.subcategories, searchQuery])
  
  // Check if category matches search
  const categoryMatches = useMemo(() => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      category.userLabel.toLowerCase().includes(query) ||
      category.shortDescription.toLowerCase().includes(query) ||
      category.id.toLowerCase().includes(query) ||
      filteredSubcategories.length > 0
    )
  }, [category, searchQuery, filteredSubcategories])
  
  if (!categoryMatches) return null
  
  // Auto-expand if search is active
  const shouldBeOpen = searchQuery.length > 0 || isOpen
  
  return (
    <Card className="overflow-hidden">
      <Collapsible open={shouldBeOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2 mb-2">
                  {shouldBeOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <CardTitle className="text-lg">{category.userLabel}</CardTitle>
                  {category.defaultSeverityHint && (
                    <SeverityBadge severity={category.defaultSeverityHint} />
                  )}
                </div>
                <CardDescription className="text-sm">
                  {category.shortDescription}
                </CardDescription>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>ID: <code className="px-1 py-0.5 bg-muted rounded">{category.id}</code></span>
                  <span>•</span>
                  <span>{category.subcategories.length} subcategories</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            {filteredSubcategories.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No subcategories match your search
              </p>
            ) : (
              <div className="space-y-3">
                {filteredSubcategories.map((subcategory) => (
                  <div
                    key={subcategory.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{subcategory.userLabel}</h4>
                          {subcategory.defaultSeverityHint && (
                            <SeverityBadge severity={subcategory.defaultSeverityHint} />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {subcategory.shortDescription}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          <code className="px-1.5 py-0.5 bg-muted rounded text-xs">
                            {subcategory.id}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export default function TaxonomyDashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return WARNING_CATEGORIES
    
    const query = searchQuery.toLowerCase()
    return WARNING_CATEGORIES.filter(category => {
      // Check if category matches
      if (
        category.userLabel.toLowerCase().includes(query) ||
        category.shortDescription.toLowerCase().includes(query) ||
        category.id.toLowerCase().includes(query)
      ) {
        return true
      }
      
      // Check if any subcategory matches
      return category.subcategories.some(sub =>
        sub.userLabel.toLowerCase().includes(query) ||
        sub.shortDescription.toLowerCase().includes(query) ||
        sub.id.toLowerCase().includes(query)
      )
    })
  }, [searchQuery])
  
  const totalSubcategories = useMemo(() => {
    return WARNING_CATEGORIES.reduce((sum, cat) => sum + cat.subcategories.length, 0)
  }, [])
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Content Warning Taxonomy</h1>
            <p className="text-muted-foreground">
              Interactive dashboard for exploring the hierarchical taxonomy structure
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Version</div>
            <div className="font-semibold">{TAXONOMY_VERSION}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search categories, subcategories, or IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredCategories.length} categories • {totalSubcategories} total subcategories
          </div>
        </div>
      </div>
      
      {filteredCategories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No categories match your search query "{searchQuery}"
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
      
      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <CardTitle>About the Taxonomy</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            This taxonomy uses a hierarchical structure with parent categories and subcategories.
            Each category can have multiple specific subcategories for more granular content warnings.
          </p>
          <p>
            <strong>Severity Hints:</strong> Categories and subcategories may include default severity hints
            (mild, moderate, severe) to guide classification, though actual severity depends on context.
          </p>
          <p>
            <strong>Legacy Categories:</strong> Each category maintains a legacy category ID for backward
            compatibility with existing database constraints.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

