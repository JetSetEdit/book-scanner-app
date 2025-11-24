import { NextRequest, NextResponse } from 'next/server';
import { scanBook } from '@/lib/services/scan-service';

export const runtime = 'nodejs';

// Helper to simulate SSE stream for progress updates
// Since scanBook takes a callback, we can't easily stream it over HTTP without changing scanBook
// For now, we will just return the final result, but we could refactor scanBook to support streaming
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { isbn } = body;

        if (!isbn) {
            return NextResponse.json({ error: 'ISBN is required' }, { status: 400 });
        }

        // Create a TransformStream for SSE
        const encoder = new TextEncoder();
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();

        // Start the scan in the background
        (async () => {
            try {
                const onProgress = async (message: string) => {
                    await writer.write(encoder.encode(`data: ${JSON.stringify({ status: message })}\n\n`));
                };

                const result = await scanBook(isbn, undefined, onProgress);

                await writer.write(encoder.encode(`data: ${JSON.stringify({ result })}\n\n`));
            } catch (error) {
                console.error('Scan failed:', error);
                await writer.write(encoder.encode(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })}\n\n`));
            } finally {
                await writer.close();
            }
        })();

        return new NextResponse(stream.readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
