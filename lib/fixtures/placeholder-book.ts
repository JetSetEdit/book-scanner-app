/**
 * Fixture data for the design-time placeholder book page at /design/book-page.
 * Shape matches what BookDetails and ContentWarningsList expect. No API or Supabase.
 */

export const PLACEHOLDER_BOOK = {
  id: "00000000-0000-0000-0000-000000000001",
  isbn: "9780735211292",
  title: "Where the Crawdads Sing",
  author: "Delia Owens",
  cover_url: "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
  description:
    "For years, rumors of the 'Marsh Girl' have haunted Barkley Cove, a quiet town on the North Carolina coast. So in late 1969, when handsome Chase Andrews is found dead, the locals immediately suspect Kya Clark, the so-called Marsh Girl. But Kya is not what they say. Sensitive and intelligent, she has survived for years alone in the marsh that she calls home, finding friends in the gulls and lessons in the sand. Then the time comes when she yearns to be touched and loved. When two young men from town become intrigued by her wild beauty, Kya opens herself to a new life—until the unthinkable happens.",
  publisher: "G.P. Putnam's Sons",
  published_date: "2018",
  page_count: 384,
  categories: ["Fiction", "Literary", "Mystery", "CLASSIFICATION:M"],
} as const;

export const PLACEHOLDER_WARNINGS = [
  {
    id: "w1",
    category: "mental_health",
    category_id: "mental_health",
    subcategory_id: "academic_pressure",
    description: "Contains references to moderate themes of academic pressure and study-related stress.",
    severity: "moderate" as const,
    helpful_count: 0,
    not_helpful_count: 0,
    source: "ai_generated",
    reasoning: "The narrative touches on isolation and self-directed learning under difficult circumstances.",
  },
  {
    id: "w2",
    category: "sexual_content",
    category_id: "sexual_content",
    subcategory_id: "sexual_themes",
    description: "Contains implied romantic and intimate content; not graphic.",
    severity: "mild" as const,
    helpful_count: 2,
    not_helpful_count: 0,
    source: "ai_generated",
    reasoning: "Romantic relationships and implied intimacy are present but not explicit.",
  },
  {
    id: "w3",
    category: "abuse",
    category_id: "emotional_abuse_or_toxic_relationships",
    subcategory_id: "manipulation",
    description: "Depicts emotional manipulation and abandonment as central themes.",
    severity: "severe" as const,
    helpful_count: 5,
    not_helpful_count: 1,
    source: "ai_generated",
    reasoning: "Abandonment and conditional relationships are recurring and central to the protagonist's experience.",
  },
  {
    id: "w4",
    category: "death",
    category_id: "death_or_grief",
    subcategory_id: "character_death",
    description: "Includes death of loved ones and grief.",
    severity: "moderate" as const,
    helpful_count: 1,
    not_helpful_count: 0,
    source: "ai_generated",
    reasoning: "Multiple losses and mourning are part of the character's arc.",
  },
];
