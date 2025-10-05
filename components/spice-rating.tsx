import { Flame } from "lucide-react"
import { cn } from "@/lib/utils"

interface SpiceRatingProps {
  level: number
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

const sizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
}

const labels = ["No Spice", "Mild", "Moderate", "Hot", "Very Hot", "Extremely Hot"]

export function SpiceRating({ level, size = "md", showLabel = false }: SpiceRatingProps) {
  const clampedLevel = Math.max(0, Math.min(5, level))

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((pepper) => (
          <Flame
            key={pepper}
            className={cn(
              sizeClasses[size],
              pepper <= clampedLevel ? "fill-orange-500 text-orange-500" : "fill-muted text-muted",
            )}
          />
        ))}
      </div>
      {showLabel && <span className="text-sm font-medium ml-1">{labels[clampedLevel]}</span>}
    </div>
  )
}
