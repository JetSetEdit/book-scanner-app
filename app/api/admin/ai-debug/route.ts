import { NextRequest, NextResponse } from 'next/server';
import { findBookAndGenerateWarnings } from '@/lib/content-warning-agent';
import { WARNING_CATEGORIES, SEVERITY_MAPPING, MODEL_VERSION, TAXONOMY_VERSION } from '@/lib/config/taxonomy';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const isbn = searchParams.get('isbn');

    if (!isbn) {
        return NextResponse.json({ error: 'ISBN is required' }, { status: 400 });
    }

    try {
        const startTime = Date.now();
        const result = await findBookAndGenerateWarnings(isbn);
        const endTime = Date.now();

        return NextResponse.json({
            meta: {
                duration_ms: endTime - startTime,
                model_version: MODEL_VERSION,
                taxonomy_version: TAXONOMY_VERSION,
                timestamp: new Date().toISOString()
            },
            input: {
                isbn
            },
            result: result,
            taxonomy: {
                categories: WARNING_CATEGORIES,
                severity_mapping: SEVERITY_MAPPING
            }
        });

    } catch (error) {
        console.error('Debug endpoint error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
