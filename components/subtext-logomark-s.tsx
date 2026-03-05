import { cn } from "@/lib/utils"

interface SubtextLogomarkSProps {
  className?: string
  /** Size variant: default (bookshelf card), sm (spine card) */
  size?: "default" | "sm"
}

/**
 * Subtext lettermark "S" for use in no-cover placeholders and other branded spots.
 * Uses serif styling to match the Subtext wordmark.
 */
export function SubtextLogomarkS({ className, size = "default" }: SubtextLogomarkSProps) {
  const sizeClass = size === "sm" ? "text-3xl" : "text-5xl"
  return (
    <span
      className={cn("font-serif font-medium text-muted-foreground/70 select-none", sizeClass, className)}
      aria-hidden
    >
      S
    </span>
  )
}
