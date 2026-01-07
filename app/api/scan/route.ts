import { NextRequest, NextResponse } from 'next/server';
import { processIsbnScan } from '@/lib/services/scan-service';
import { getClientIP, checkRateLimit, incrementRateLimit } from '@/lib/utils/rate-limiter';

export const runtime = 'nodejs';

// Rate limit configuration
const SCANS_PER_DAY = parseInt(process.env.SCAN_RATE_LIMIT || '5', 10);

// Helper to simulate SSE stream for progress updates
// Since scanBook takes a callback, we can't easily stream it over HTTP without changing scanBook
// For now, we will just return the final result, but we could refactor scanBook to support streaming
export async function POST(req: NextRequest) {
    try {
        // Parse request body once
        const body = await req.json();
        const { isbn, forceRefresh, selectedCandidate, timezone, scanMode } = body;

        const normalizedScanMode: 'quick' | 'deep' =
          scanMode === 'quick' || scanMode === 'deep' ? scanMode : 'deep'
        
        // Check rate limit before processing
        const clientIP = getClientIP(req);
        const rateLimit = checkRateLimit(clientIP, SCANS_PER_DAY, timezone);
        
        if (!rateLimit.allowed) {
            // Format reset time in user's timezone if provided, otherwise use UTC
            const resetDate = new Date(rateLimit.resetAt);
            const resetTime = timezone
                ? resetDate.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true,
                    timeZone: timezone
                  })
                : resetDate.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  });
            
            // For streaming response, we need to send error through stream
            const encoder = new TextEncoder();
            const stream = new TransformStream();
            const writer = stream.writable.getWriter();
            
            (async () => {
                try {
                    await writer.write(encoder.encode(`data: ${JSON.stringify({ 
                        status: `⚠️ Rate limit exceeded` 
                    })}\n\n`))
                    await writer.write(encoder.encode(`data: ${JSON.stringify({ 
                        error: {
                            error: 'Rate limit exceeded',
                            message: `You've reached the daily scan limit of ${SCANS_PER_DAY} scans. Limit resets at ${resetTime}.`,
                            rateLimit: {
                                limit: SCANS_PER_DAY,
                                remaining: 0,
                                resetAt: rateLimit.resetAt
                            }
                        }
                    })}\n\n`))
                } finally {
                    await writer.close()
                }
            })()
            
            return new NextResponse(stream.readable, {
                status: 429,
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'X-RateLimit-Limit': SCANS_PER_DAY.toString(),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': rateLimit.resetAt.toString(),
                    'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString()
                }
            });
        }

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

                console.log(`[Scan API] Starting scan for ISBN: ${isbn}, scanMode: ${normalizedScanMode}, forceRefresh: ${forceRefresh}, selectedCandidate: ${selectedCandidate ? 'provided' : 'none'}`)
                await writer.write(encoder.encode(`data: ${JSON.stringify({ status: '🚀 Starting scan process...' })}\n\n`))

                const result = await processIsbnScan(
                  isbn,
                  onProgress,
                  selectedCandidate,
                  forceRefresh === true,
                  undefined,
                  undefined,
                  normalizedScanMode
                )

                // Increment rate limit only after successful scan
                if (result.success) {
                  incrementRateLimit(clientIP, timezone)
                }

                console.log(`[Scan API] Scan completed: success=${result.success}, warnings=${result.contentWarningsGenerated ? 'yes' : 'no'}`)
                console.log(`[Scan API] Result structure:`, {
                  hasSuccess: 'success' in result,
                  hasBook: !!result.book,
                  hasScan: !!result.scan,
                  keys: Object.keys(result)
                })
                
                // Include rate limit info in response
                const updatedRateLimit = checkRateLimit(clientIP, SCANS_PER_DAY, timezone)
                const responseResult = {
                  ...result,
                  rateLimit: {
                    limit: SCANS_PER_DAY,
                    remaining: updatedRateLimit.remaining,
                    resetAt: updatedRateLimit.resetAt
                  }
                }
                
                await writer.write(encoder.encode(`data: ${JSON.stringify({ status: '✅ Scan process completed' })}\n\n`))
                await writer.write(encoder.encode(`data: ${JSON.stringify({ result: responseResult })}\n\n`))
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
