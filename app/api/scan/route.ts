import { NextRequest, NextResponse } from 'next/server';
import { processIsbnScan } from '@/lib/services/scan-service';

export const runtime = 'nodejs';

// Helper to simulate SSE stream for progress updates
// Since scanBook takes a callback, we can't easily stream it over HTTP without changing scanBook
// For now, we will just return the final result, but we could refactor scanBook to support streaming
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { isbn, forceRefresh, selectedCandidate } = body;

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
                const onProgress = async (message: string | { action: string; timestamp?: number }) => {
                    try {
                        const statusMessage = typeof message === 'string' ? message : message.action
                        await writer.write(encoder.encode(`data: ${JSON.stringify({ status: statusMessage })}\n\n`))
                    } catch (writeError) {
                        console.error('Error writing progress:', writeError)
                        // Don't throw - continue scan even if progress write fails
                    }
                }

                console.log(`[Scan API] Starting scan for ISBN: ${isbn}, forceRefresh: ${forceRefresh}, selectedCandidate: ${selectedCandidate ? 'provided' : 'none'}`)
                await writer.write(encoder.encode(`data: ${JSON.stringify({ status: '🚀 Starting scan process...' })}\n\n`))

                const result = await processIsbnScan(isbn, onProgress, selectedCandidate, forceRefresh === true)

                console.log(`[Scan API] Scan completed: success=${result.success}, warnings=${result.contentWarningsGenerated ? 'yes' : 'no'}`)
                console.log(`[Scan API] Result structure:`, {
                  hasSuccess: 'success' in result,
                  hasBook: !!result.book,
                  hasScan: !!result.scan,
                  keys: Object.keys(result)
                })
                await writer.write(encoder.encode(`data: ${JSON.stringify({ status: '✅ Scan process completed' })}\n\n`))
                await writer.write(encoder.encode(`data: ${JSON.stringify({ result })}\n\n`))
            } catch (error) {
                console.error('[Scan API] Scan failed:', error)
                console.error('[Scan API] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
                
                const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                const errorDetails = {
                    error: errorMessage,
                    errorType: error instanceof Error ? error.constructor.name : typeof error,
                    stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
                    isbn: isbn
                }
                
                try {
                    await writer.write(encoder.encode(`data: ${JSON.stringify({ status: `❌ Scan failed: ${errorMessage}` })}\n\n`))
                    await writer.write(encoder.encode(`data: ${JSON.stringify({ error: errorDetails })}\n\n`))
                } catch (writeError) {
                    console.error('[Scan API] Failed to write error to stream:', writeError)
                }
            } finally {
                try {
                    await writer.close()
                } catch (closeError) {
                    console.error('[Scan API] Error closing stream:', closeError)
                }
            }
        })()

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
