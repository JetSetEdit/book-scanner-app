export const TAXONOMY_VERSION = "1.0.0";
export const MODEL_VERSION = "gpt-4o-2024-11-20"; // Example model version

export interface WarningCategory {
    id: string;
    userLabel: string;
    shortDescription: string;
    defaultSeverityHint?: 'mild' | 'moderate' | 'severe';
    legacyCategory: string; // For backward compatibility with DB constraints
}

export const WARNING_CATEGORIES: WarningCategory[] = [
    {
        id: 'mental_health',
        userLabel: 'Mental Health',
        shortDescription: 'Depression, anxiety, suicide, eating disorders, and other mental health themes.',
        legacyCategory: 'mental_health'
    },
    {
        id: 'sexual_content',
        userLabel: 'Sexual Content',
        shortDescription: 'Sexual situations, explicit content, sexual violence, or intense romance.',
        legacyCategory: 'sexual_content'
    },
    {
        id: 'emotional_abuse_or_toxic_relationships',
        userLabel: 'Emotional Abuse / Toxic Relationships',
        shortDescription: 'Gaslighting, manipulation, controlling behavior, or toxic relationship dynamics.',
        legacyCategory: 'abuse'
    },
    {
        id: 'bullying_or_social_cruelty',
        userLabel: 'Bullying / Social Cruelty',
        shortDescription: 'Bullying, hazing, public humiliation, or intense social pressure.',
        legacyCategory: 'abuse'
    },
    {
        id: 'violence',
        userLabel: 'Violence',
        shortDescription: 'Physical violence, fighting, weapons, war, or gore.',
        legacyCategory: 'violence'
    },
    {
        id: 'substance_use_or_alcohol',
        userLabel: 'Substance Use',
        shortDescription: 'Alcohol consumption, drug use, addiction, or overdose.',
        legacyCategory: 'substance_abuse'
    },
    {
        id: 'self_harm_or_suicidal_ideation',
        userLabel: 'Self-Harm / Suicide',
        shortDescription: 'Self-harm, suicidal thoughts, attempts, or detailed descriptions of suicide.',
        legacyCategory: 'mental_health'
    },
    {
        id: 'death_or_grief',
        userLabel: 'Death / Grief',
        shortDescription: 'Character deaths, terminal illness, mourning, or funeral scenes.',
        legacyCategory: 'death'
    },
    {
        id: 'discrimination',
        userLabel: 'Discrimination',
        shortDescription: 'Racism, sexism, homophobia, transphobia, or other forms of hate speech/discrimination.',
        legacyCategory: 'discrimination'
    },
    {
        id: 'language',
        userLabel: 'Coarse Language',
        shortDescription: 'Strong language, swearing, or slurs.',
        legacyCategory: 'other'
    },
    {
        id: 'other',
        userLabel: 'Other',
        shortDescription: 'Other potentially triggering content not covered by specific categories.',
        legacyCategory: 'other'
    }
];

export type SeverityLevel = 'none' | 'mild' | 'moderate' | 'severe';

export const SEVERITY_MAPPING = {
    none: { min: 0.0, max: 0.30 },
    mild: { min: 0.31, max: 0.55 },
    moderate: { min: 0.56, max: 0.80 },
    severe: { min: 0.81, max: 1.0 }
};

export function getSeverityFromScore(score: number): SeverityLevel {
    if (score <= SEVERITY_MAPPING.none.max) return 'none';
    if (score <= SEVERITY_MAPPING.mild.max) return 'mild';
    if (score <= SEVERITY_MAPPING.moderate.max) return 'moderate';
    return 'severe';
}

export function getCategoryById(id: string): WarningCategory | undefined {
    return WARNING_CATEGORIES.find(c => c.id === id);
}
