"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface AustralianClassificationProps {
  rating: "G" | "PG" | "M" | "MA15+" | "R18+" | "X18+"
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

const ratingInfo = {
  G: {
    label: "General",
    description: "Content is very mild in impact. Suitable for everyone.",
    category: "advisory" as const,
    filename: "G_6pt_pos.png"
  },
  PG: {
    label: "Parental Guidance", 
    description: "Content is mild in impact. May require parental guidance.",
    category: "advisory" as const,
    filename: "PG_6pt_pos.png"
  },
  M: {
    label: "Mature",
    description: "Content is moderate in impact. Not recommended for children under 15.",
    category: "advisory" as const,
    filename: "M_6pt_pos.png"
  },
  "MA15+": {
    label: "Mature Accompanied",
    description: "Content is strong in impact. Legally restricted to people aged 15 and over.",
    category: "restricted" as const,
    filename: "MA15+_6pt_pos.png"
  },
  "R18+": {
    label: "Restricted",
    description: "Content is high in impact. Legally restricted to adults 18 years and over.",
    category: "restricted" as const,
    filename: "R18+_6pt_pos.png"
  },
  "X18+": {
    label: "Restricted",
    description: "Sexually explicit content. Legally restricted to adults 18 years and over.",
    category: "restricted" as const,
    filename: "X18+_6pt_pos.png"
  }
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12", 
  lg: "w-16 h-16"
}

export function AustralianClassification({ 
  rating, 
  size = "md", 
  showLabel = false,
  className 
}: AustralianClassificationProps) {
  const info = ratingInfo[rating]
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "relative flex-shrink-0",
        sizeClasses[size]
      )}>
        <Image
          src={`/classification-symbols/${info.filename}`}
          alt={`${rating} - ${info.label}`}
          fill
          className="object-contain"
        />
      </div>
      
      {showLabel && (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {rating} - {info.label}
          </span>
          <span className="text-xs text-muted-foreground">
            {info.description}
          </span>
        </div>
      )}
    </div>
  )
}

// Helper function to get classification info
export function getClassificationInfo(rating: string) {
  return ratingInfo[rating as keyof typeof ratingInfo] || null
}

// Helper function to check if rating is restricted
export function isRestrictedRating(rating: string): boolean {
  const info = getClassificationInfo(rating)
  return info?.category === "restricted" || false
}
