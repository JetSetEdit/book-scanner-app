import { cn } from "@/lib/utils"
import { BookSpineLogo } from "@/components/book-spine-logo"

interface NoCoverPlaceholderProps {
  className?: string
  /** Size variant: default (bookshelf card), sm (spine card) */
  size?: "default" | "sm"
}

/**
 * Subtext-branded "No cover" placeholder: nav logomark (spine S) + label.
 * Use in book cards when cover_url is missing.
 */
export function NoCoverPlaceholder({ className, size = "default" }: NoCoverPlaceholderProps) {
  const textSizeClass = size === "sm" ? "text-[10px]" : "text-xs"
  const logoSizeClass = size === "sm" ? "h-14 w-14" : "h-24 w-24"
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/40 text-muted-foreground",
        className
      )}
    >
      <BookSpineLogo className={cn(logoSizeClass, "text-muted-foreground/70")} aria-hidden />
      <span className={cn("font-medium text-muted-foreground/80", textSizeClass)}>No cover</span>
    </div>
  )
}
