import {
  AlertTriangle,
  Brain,
  Flame,
  HeartCrack,
  Users,
  Sword,
  Wine,
  Activity,
  Skull,
  Ban,
  Hash,
  Pill,
} from "lucide-react"

/**
 * Returns the Lucide icon component for a content warning category or legacy category id.
 * Matches the mapping in content-warnings-list.tsx CategoryIcon.
 */
export function getCategoryIcon(categoryId: string, className?: string) {
  // Granular / category_id mapping
  switch (categoryId) {
    case "mental_health":
      return <Brain className={className} />
    case "sexual_content":
      return <Flame className={className} />
    case "emotional_abuse_or_toxic_relationships":
      return <HeartCrack className={className} />
    case "bullying_or_social_cruelty":
      return <Users className={className} />
    case "violence":
      return <Sword className={className} />
    case "substance_use_or_alcohol":
      return <Wine className={className} />
    case "self_harm_or_suicidal_ideation":
      return <Activity className={className} />
    case "death_or_grief":
      return <Skull className={className} />
    case "discrimination":
      return <Ban className={className} />
    case "language":
      return <Hash className={className} />
    // Legacy
    case "abuse":
      return <HeartCrack className={className} />
    case "substance_abuse":
      return <Pill className={className} />
    case "death":
      return <Skull className={className} />
    default:
      return <AlertTriangle className={className} />
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  mental_health: "Mental health",
  sexual_content: "Sexual content",
  emotional_abuse_or_toxic_relationships: "Emotional abuse",
  bullying_or_social_cruelty: "Bullying",
  violence: "Violence",
  substance_use_or_alcohol: "Substance use",
  self_harm_or_suicidal_ideation: "Self-harm",
  death_or_grief: "Death or grief",
  discrimination: "Discrimination",
  language: "Language",
  abuse: "Abuse",
  substance_abuse: "Substance abuse",
  death: "Death",
}

/**
 * Returns a short, user-facing label for a category id. Used for tooltips/aria-label.
 */
export function getCategoryLabel(categoryId: string): string {
  return CATEGORY_LABELS[categoryId] ?? categoryId.replace(/_/g, " ")
}
