"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronDown, X, SlidersHorizontal } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

// Age rating options (Australian Classification)
const AGE_RATINGS = [
    { id: "G", label: "G", description: "General" },
    { id: "PG", label: "PG", description: "Parental Guidance" },
    { id: "M", label: "M", description: "Mature" },
    { id: "MA15+", label: "MA15+", description: "Mature Accompanied" },
    { id: "R18+", label: "R18+", description: "Restricted" },
]

// Subtext Suitability Scale (SSS) - emotional intensity
const SSS_LEVELS = [
    { id: "S0_NO_INPUT", label: "S0 – No rating", description: "Not yet assessed" },
    { id: "S1_GENTLE", label: "S1 – Gentle", description: "Very low-intensity, brief difficulty" },
    { id: "S2_MILD", label: "S2 – Mild", description: "Some upsetting moments, light tone" },
    { id: "S3_MODERATE", label: "S3 – Moderate", description: "Recurring difficult content" },
    { id: "S4_INTENSE", label: "S4 – Intense", description: "Sustained distressing content" },
]

// Severity levels
const SEVERITY_LEVELS = [
    { id: "severe", label: "Has Severe Warnings" },
    { id: "moderate", label: "Has Moderate Warnings" },
    { id: "mild", label: "Mild Warnings Only" },
]

// Top warning categories (from taxonomy)
const WARNING_CATEGORIES = [
    { id: "violence", label: "Violence" },
    { id: "sexual_content", label: "Sexual Content" },
    { id: "mental_health", label: "Mental Health" },
    { id: "substance_use_or_alcohol", label: "Substance Use" },
    { id: "death_or_grief", label: "Death / Grief" },
    { id: "discrimination", label: "Discrimination" },
    { id: "emotional_abuse_or_toxic_relationships", label: "Toxic Relationships" },
    { id: "phobias", label: "Phobias" },
]

export interface FilterCounts {
    ratings: Record<string, number>
    severities: Record<string, number>
    categories: Record<string, number>
    sss: Record<string, number>
}

interface CollectionFiltersProps {
    counts?: FilterCounts
    className?: string
}

export function CollectionFilters({ counts, className }: CollectionFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Parse current filters from URL
    const currentRatings = searchParams.get("rating")?.split(",").filter(Boolean) || []
    const currentSeverities = searchParams.get("severity")?.split(",").filter(Boolean) || []
    const currentCategories = searchParams.get("category")?.split(",").filter(Boolean) || []
    const currentSss = searchParams.get("sss")?.split(",").filter(Boolean) || []

    const hasActiveFilters = currentRatings.length > 0 || currentSeverities.length > 0 || currentCategories.length > 0 || currentSss.length > 0

    // Toggle a filter value
    const toggleFilter = (type: "rating" | "severity" | "category" | "sss", value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        const currentValues = params.get(type)?.split(",").filter(Boolean) || []

        let newValues: string[]
        if (currentValues.includes(value)) {
            newValues = currentValues.filter(v => v !== value)
        } else {
            newValues = [...currentValues, value]
        }

        if (newValues.length === 0) {
            params.delete(type)
        } else {
            params.set(type, newValues.join(","))
        }

        // Reset to page 1 when filters change
        params.delete("page")

        router.push(`/collection?${params.toString()}`)
    }

    // Clear all filters
    const clearAllFilters = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete("rating")
        params.delete("severity")
        params.delete("category")
        params.delete("sss")
        params.delete("page")
        router.push(`/collection?${params.toString()}`)
    }

    return (
        <div className={cn("space-y-4", className)}>
            {/* Header with Clear All */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                </div>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-3 w-3 mr-1" />
                        Clear All
                    </Button>
                )}
            </div>

            {/* Subtext Suitability Scale (SSS) - Primary filter */}
            <FilterSection title="Subtext Suitability" defaultOpen={true}>
                <div className="space-y-2">
                    {SSS_LEVELS.map((level) => (
                        <FilterCheckbox
                            key={level.id}
                            id={`sss-${level.id}`}
                            label={level.label}
                            count={counts?.sss[level.id]}
                            checked={currentSss.includes(level.id)}
                            onCheckedChange={() => toggleFilter("sss", level.id)}
                        />
                    ))}
                </div>
            </FilterSection>

            {/* Severity Level */}
            <FilterSection title="Severity Level" defaultOpen={true}>
                <div className="space-y-2">
                    {SEVERITY_LEVELS.map((severity) => (
                        <FilterCheckbox
                            key={severity.id}
                            id={`severity-${severity.id}`}
                            label={severity.label}
                            count={counts?.severities[severity.id]}
                            checked={currentSeverities.includes(severity.id)}
                            onCheckedChange={() => toggleFilter("severity", severity.id)}
                        />
                    ))}
                </div>
            </FilterSection>

            {/* Age Rating (ACB) */}
            <FilterSection title="Australian Classification" defaultOpen={false}>
                <div className="space-y-2">
                    {AGE_RATINGS.map((rating) => (
                        <FilterCheckbox
                            key={rating.id}
                            id={`rating-${rating.id}`}
                            label={rating.label}
                            count={counts?.ratings[rating.id]}
                            checked={currentRatings.includes(rating.id)}
                            onCheckedChange={() => toggleFilter("rating", rating.id)}
                        />
                    ))}
                </div>
            </FilterSection>

            {/* Warning Categories */}
            <FilterSection title="Warning Category" defaultOpen={false}>
                <div className="space-y-2">
                    {WARNING_CATEGORIES.map((category) => (
                        <FilterCheckbox
                            key={category.id}
                            id={`category-${category.id}`}
                            label={category.label}
                            count={counts?.categories[category.id]}
                            checked={currentCategories.includes(category.id)}
                            onCheckedChange={() => toggleFilter("category", category.id)}
                        />
                    ))}
                </div>
            </FilterSection>
        </div>
    )
}

// Collapsible filter section
function FilterSection({
    title,
    defaultOpen = false,
    children,
}: {
    title: string
    defaultOpen?: boolean
    children: React.ReactNode
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border-b pb-4">
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-foreground/80 transition-colors">
                {title}
                <ChevronDown
                    className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform duration-200",
                        isOpen && "rotate-180"
                    )}
                />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
                {children}
            </CollapsibleContent>
        </Collapsible>
    )
}

// Individual filter checkbox with count
function FilterCheckbox({
    id,
    label,
    count,
    checked,
    onCheckedChange,
}: {
    id: string
    label: string
    count?: number
    checked: boolean
    onCheckedChange: () => void
}) {
    return (
        <label
            htmlFor={id}
            className="flex items-center gap-2 cursor-pointer text-sm hover:text-foreground/80 transition-colors"
        >
            <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={onCheckedChange}
            />
            <span className="flex-1">{label}</span>
            {count !== undefined && (
                <span className="text-xs text-muted-foreground">[{count}]</span>
            )}
        </label>
    )
}

// Mobile filter button component
export function MobileFilterButton({ onClick }: { onClick: () => void }) {
    const searchParams = useSearchParams()
    const hasFilters =
        searchParams.get("rating") ||
        searchParams.get("severity") ||
        searchParams.get("category") ||
        searchParams.get("sss")

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onClick}
            className="lg:hidden gap-2"
        >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasFilters && (
                <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
                    •
                </span>
            )}
        </Button>
    )
}
