export interface TrainingExample {
    book_title: string;
    book_author: string;
    book_description: string;
    book_categories: string[];
    expected_warnings: {
        category: string;
        description: string;
        severity: string;
    }[];
    notes?: string;
}

export const trainingExamples: TrainingExample[] = [
    {
        book_title: "WHEN THE MOON HATCHED",
        book_author: "Sarah A. Parker",
        book_description: "A dark romance novel with themes of ambition, betrayal, and dangerous desires",
        book_categories: ["Romance", "Fiction"],
        expected_warnings: [
            {
                category: "death",
                description: "Death",
                severity: "moderate"
            },
            {
                category: "violence",
                description: "Mild violence",
                severity: "mild"
            },
            {
                category: "abuse",
                description: "Mention of child abandonment/abuse",
                severity: "moderate"
            }
        ],
        notes: "Author-approved content warnings from official website"
    },
    {
        book_title: "KING OF SLOTH",
        book_author: "Ana Huang",
        book_description: "A dark romance novel with themes of family dynamics, health struggles, and complex relationships",
        book_categories: ["Romance", "Fiction"],
        expected_warnings: [
            {
                category: "other",
                description: "Cheating (not by a main character)",
                severity: "mild"
            },
            {
                category: "death",
                description: "Death of a parent",
                severity: "moderate"
            },
            {
                category: "abuse",
                description: "Emotional abuse and family estrangement",
                severity: "moderate"
            },
            {
                category: "mental_health",
                description: "Mentions of Chronic Fatigue Syndrome",
                severity: "mild"
            }
        ],
        notes: "Author-approved content warnings from official website"
    },
    {
        book_title: "KING OF ENVY",
        book_author: "Ana Huang",
        book_description: "A dark romance novel with themes of obsession, revenge, and dangerous power dynamics",
        book_categories: ["Romance", "Fiction"],
        expected_warnings: [
            {
                category: "abuse",
                description: "Sexual harassment and assault and financial abuse",
                severity: "severe"
            },
            {
                category: "violence",
                description: "Death and murder, torture, and arson",
                severity: "severe"
            }
        ],
        notes: "Author-approved content warnings from official website"
    },
    {
        book_title: "THE STRIKER",
        book_author: "Ana Huang",
        book_description: "A romance novel with themes of sports, relationships, and life challenges",
        book_categories: ["Romance", "Fiction"],
        expected_warnings: [
            {
                category: "violence",
                description: "Car accidents and injuries",
                severity: "moderate"
            },
            {
                category: "mental_health",
                description: "Chronic pain representation",
                severity: "mild"
            },
            {
                category: "death",
                description: "Death of loved ones",
                severity: "moderate"
            }
        ],
        notes: "Author-approved content warnings from official website"
    },
    {
        book_title: "Icebreaker",
        book_author: "Hannah Grace",
        book_description: "A contemporary romance novel with themes of sports, relationships, and personal growth",
        book_categories: ["Romance", "Fiction"],
        expected_warnings: [
            {
                category: "mental_health",
                description: "Disordered eating, anxiety and stress",
                severity: "moderate"
            },
            {
                category: "sexual_content",
                description: "Sexual content (consensual)",
                severity: "moderate"
            },
            {
                category: "other",
                description: "Toxic friendships",
                severity: "mild"
            },
            {
                category: "violence",
                description: "Near death experience",
                severity: "moderate"
            },
            {
                category: "death",
                description: "Death of a parent (past event, only discussed)",
                severity: "mild"
            },
            {
                category: "other",
                description: "Cheating (past event, only discussed and not involving either main character)",
                severity: "mild"
            },
            {
                category: "substance_abuse",
                description: "Alcohol use",
                severity: "mild"
            },
            {
                category: "other",
                description: "Explicit language",
                severity: "mild"
            }
        ],
        notes: "Author-approved content warnings from official website"
    },
    {
        book_title: "Wildfire",
        book_author: "Hannah Grace",
        book_description: "A contemporary romance novel with themes of relationships, personal struggles, and growth",
        book_categories: ["Romance", "Fiction"],
        expected_warnings: [
            {
                category: "substance_abuse",
                description: "Addiction issues (parent) and alcohol use",
                severity: "moderate"
            },
            {
                category: "abuse",
                description: "Parental neglect and verbal abuse",
                severity: "severe"
            },
            {
                category: "mental_health",
                description: "Mental health (low self esteem)",
                severity: "moderate"
            },
            {
                category: "sexual_content",
                description: "Sexual content (consensual)",
                severity: "moderate"
            },
            {
                category: "other",
                description: "Explicit language",
                severity: "mild"
            }
        ],
        notes: "Author-approved content warnings from official website"
    },
    {
        book_title: "Daydream",
        book_author: "Hannah Grace",
        book_description: "A contemporary romance novel with themes of family dynamics, academic pressure, and personal identity",
        book_categories: ["Romance", "Fiction"],
        expected_warnings: [
            {
                category: "mental_health",
                description: "Family pressure (shown through the eyes of an eldest daughter), anxiety, and social/academic pressures, and internalized pressures related to neurodivergence (undiagnosed)",
                severity: "moderate"
            },
            {
                category: "sexual_content",
                description: "Sexual content (consensual) and discussions about being pressured sexually",
                severity: "moderate"
            },
            {
                category: "substance_abuse",
                description: "Alcohol use, drug use (not main characters), and drink spiking (not main characters)",
                severity: "moderate"
            },
            {
                category: "discrimination",
                description: "Mention of Black women being disproportionately impacted by medical negligence",
                severity: "mild"
            },
            {
                category: "other",
                description: "Discussions about birth control",
                severity: "mild"
            },
            {
                category: "violence",
                description: "Physical altercation (not between main characters)",
                severity: "mild"
            },
            {
                category: "other",
                description: "Explicit language",
                severity: "mild"
            }
        ],
        notes: "Author-approved content warnings from official website"
    },
    {
        book_title: "Holiday Ever After",
        book_author: "Hannah Grace",
        book_description: "A contemporary romance novel with themes of holidays, relationships, and family",
        book_categories: ["Romance", "Fiction"],
        expected_warnings: [
            {
                category: "sexual_content",
                description: "Sexual content (consensual)",
                severity: "moderate"
            },
            {
                category: "death",
                description: "Death of a grandparent (past event, only discussed)",
                severity: "mild"
            },
            {
                category: "substance_abuse",
                description: "Alcohol use",
                severity: "mild"
            },
            {
                category: "other",
                description: "Explicit language",
                severity: "mild"
            }
        ],
        notes: "Author-approved content warnings from official website"
    }
];

// Function to get random training examples for the AI agent
export function getRandomTrainingExamples(count: number = 3): TrainingExample[] {
    const shuffled = [...trainingExamples].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Function to format examples for the AI prompt
export function formatExamplesForPrompt(examples: TrainingExample[]): string {
    return examples.map((example, index) => `
Example ${index + 1}:
Book: "${example.book_title}" by ${example.book_author}
Description: ${example.book_description}
Expected Warnings: ${JSON.stringify(example.expected_warnings, null, 2)}
${example.notes ? `Notes: ${example.notes}` : ''}
`).join('\n');
}
