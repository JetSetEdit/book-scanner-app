import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// Mock interface for the ML model result (since we don't have the Python model running in Edge yet)
// In a real deployment, this would call an external ML API or use an ONNX model.
interface ContentAnalysisResult {
    category: string;
    intensity: 'none' | 'low' | 'moderate' | 'high';
    rationale?: string;
}

// Heuristic logic ported from prototype_analysis.py
function applyStrictHeuristics(blurb: string, genre: string, baseAnalysis: Record<string, ContentAnalysisResult>) {
    const strictAnalysis = { ...baseAnalysis };
    const lowerBlurb = blurb.toLowerCase();
    const lowerGenre = genre.toLowerCase();

    // Genre: Adult Fantasy
    if (lowerGenre.includes('adult fantasy') || lowerGenre.includes('dark fantasy')) {
        // RULE 1: Romance in adult fantasy -> risk of explicit content
        if (lowerBlurb.includes('romance') || lowerBlurb.includes('passion')) {
            const current = strictAnalysis['sexual_content'].intensity;
            if (['none', 'low', 'moderate'].includes(current)) {
                strictAnalysis['sexual_content'] = {
                    category: 'sexual_content',
                    intensity: 'high', // Strictly escalating to high/moderate-high
                    rationale: 'Genre (Adult Fantasy) + "romance" keyword implies potential explicit dynamics (Strict Mode).'
                };
            }
        }

        // RULE 2: Police/Famine/War -> Systemic violence
        if (lowerBlurb.includes('police') || lowerBlurb.includes('famine') || lowerBlurb.includes('war')) {
            strictAnalysis['violence'] = {
                category: 'violence',
                intensity: 'high',
                rationale: 'Genre (Adult Fantasy) + "police/famine" keywords implies systemic brutality (Strict Mode).'
            };
        }
    }

    return strictAnalysis;
}

export async function POST(request: NextRequest) {
    try {
        const { isbn } = await request.json();

        if (!isbn) {
            return NextResponse.json({ error: 'ISBN is required' }, { status: 400 });
        }

        // Step 1: Fetch Metadata (Mocking/Using OpenLibrary as example for Edge compatibility)
        // In production, reuse `fetchCandidatesByISBN` from @/lib/book-api
        const metadataUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=details&format=json`;
        const metadataRes = await fetch(metadataUrl);
        const metadata = await metadataRes.json();
        const bookKey = `ISBN:${isbn}`;
        const bookData = metadata[bookKey];

        if (!bookData) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        const blurb = bookData.details?.description?.value || bookData.details?.description || "No description available.";
        // Simple genre detection based on subjects if available, else default/user-input
        const subjects = (bookData.details?.subjects || []).join(' ').toLowerCase();
        let genre = 'general';
        if (subjects.includes('fantasy')) genre = 'adult_fantasy'; // Simplified for demo

        // Step 2: Base Analysis (Mocking the TF-IDF/NB outcome)
        // Ideally this calls a dedicated Python microservice or runs a lightweight NLP model
        const baseAnalysis: Record<string, ContentAnalysisResult> = {
            violence: { category: 'violence', intensity: 'low', rationale: 'Base keyword scan.' },
            sexual_content: { category: 'sexual_content', intensity: 'low', rationale: 'Base keyword scan.' },
            emotional_abuse: { category: 'emotional_abuse', intensity: 'low', rationale: 'Base keyword scan.' },
            mental_health: { category: 'mental_health', intensity: 'low', rationale: 'Base keyword scan.' },
            discrimination: { category: 'discrimination', intensity: 'low', rationale: 'Base keyword scan.' }
        };

        // Step 3: Apply Strict Heuristics
        const strictResults = applyStrictHeuristics(blurb, genre, baseAnalysis);

        return NextResponse.json({
            isbn,
            title: bookData.details?.title,
            genre_detected: genre,
            strict_analysis: strictResults
        });

    } catch (error) {
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error instanceof Error ? error.message : 'Unknown'
        }, { status: 500 });
    }
}
