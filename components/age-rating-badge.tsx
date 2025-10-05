import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface AgeRatingBadgeProps {
  rating: string
  size?: "sm" | "md" | "lg"
}

const ratingColors = {
  G: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  PG: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "PG-13": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  R: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "18+": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export function AgeRatingBadge({ rating, size = "md" }: AgeRatingBadgeProps) {
  const colorClass = ratingColors[rating as keyof typeof ratingColors] || ratingColors["PG"]

  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-bold",
        colorClass,
        size === "sm" && "text-xs px-2 py-0.5",
        size === "lg" && "text-base px-3 py-1",
      )}
    >
      {rating}
    </Badge>
  )
}
