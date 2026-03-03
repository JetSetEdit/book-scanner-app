import { NextRequest, NextResponse } from 'next/server';
import { processIsbnScan } from '@/lib/services/scan-service';
import { getClientIP, checkRateLimit, checkRateLimitWithCost, incrementRateLimitBy, isIpAllowlisted, shouldAssignGemini } from '@/lib/utils/rate-limiter';
import { getUserIdentifier, getActiveBonusScans } from '@/lib/services/referral-bonus-service';
import { claimReferralBonus } from '@/lib/services/referral-service';

export const runtime = 'nodejs';

// Rate limit configuration
const SCAN_CREDITS_PER_DAY = parseInt(process.env.SCAN_RATE_LIMIT || '5', 10);
const DEEP_SCAN_COST = parseInt(process.env.DEEP_SCAN_COST || '2', 10);
const QUICK_SCAN_COST = parseInt(process.env.QUICK_SCAN_COST || '1', 10);

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

    const scanCost =
      normalizedScanMode === 'deep'
        ? (Number.isFinite(DEEP_SCAN_COST) && DEEP_SCAN_COST > 0 ? DEEP_SCAN_COST : 2)
        : (Number.isFinite(QUICK_SCAN_COST) && QUICK_SCAN_COST > 0 ? QUICK_SCAN_COST : 1)

    // Rate limit logic
    const hasVipPass = req.cookies.has('subtext_vip')
    const clientIP = getClientIP(req);

    // Get user identifier for bonus scans
    const userId = getUserIdentifier(req);

    // Get active bonus scans (if any)
    const bonusScans = await getActiveBonusScans(userId);

    // Dev/Admin IPs and VIPs (invite code) are unlimited
    const isDev = isIpAllowlisted(clientIP);
    const isUnlimited = isDev || hasVipPass;

    const baseLimit = hasVipPass ? 50 : SCAN_CREDITS_PER_DAY; // used only when !isUnlimited

    // Check status based on effective limit (base + bonus); skip check for unlimited users
    const rateLimitCheck = isUnlimited
      ? { allowed: true, remaining: 999, resetAt: Date.now() + 86400000, effectiveLimit: 999 }
      : await checkRateLimitWithCost(clientIP, baseLimit, timezone, scanCost, userId, bonusScans);

    const rateLimit = isUnlimited
      ? {
        allowed: true,
        remaining: 999,
        resetAt: Date.now() + 86400000,
        cost: scanCost,
        required: scanCost,
        unlimited: true,
        effectiveLimit: 999,
      }
      : {
        ...rateLimitCheck,
        unlimited: false,
        limit: rateLimitCheck.effectiveLimit
      };

    // Determine model assignment (only for Quick scans)
    const modelAssignment = normalizedScanMode === 'quick'
      ? (shouldAssignGemini(clientIP) ? 'gemini' : 'openai')
      : null // Deep scans ignore IP assignment

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
          // Get active bonus scans to show in message
          const activeBonusScans = await getActiveBonusScans(userId)
          const referralMessage = activeBonusScans === 0
            ? `You've used your ${SCAN_CREDITS_PER_DAY} base scans. You have 0 bonus scans active right now. Refer a friend to earn 3 more bonus scans!`
            : `You've used your ${SCAN_CREDITS_PER_DAY} base scans and ${activeBonusScans} bonus scans. Refer a friend to earn more bonus scans!`

          await writer.write(encoder.encode(`data: ${JSON.stringify({
            error: {
              error: 'Rate limit exceeded',
              message: `${referralMessage} Credits reset at ${resetTime}.`,
              rateLimit: {
                limit: rateLimitCheck.effectiveLimit,
                remaining: 0,
                resetAt: rateLimit.resetAt,
                cost: scanCost,
                unlimited: false,
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
          'X-RateLimit-Limit': SCAN_CREDITS_PER_DAY.toString(),
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
          normalizedScanMode,
          modelAssignment
        )

        // Check for referral cookie and claim bonus on first scan
        const referralCode = req.cookies.get('subtext_ref')?.value
        let bonusClaimInfo: any = null // Initialize outside to ensure scope visibility

        if (result.success) {
          // Only increment for users who have a limit (not dev IPs, not VIPs)
          if (!isUnlimited) {
            incrementRateLimitBy(clientIP, timezone, scanCost)
          }

          if (referralCode) {
            try {
              const claimResult = await claimReferralBonus(userId, referralCode)
              if (claimResult.success) {
                // Clear referral cookie after claiming (one-time use)
                // Note: We can't clear cookies in SSE stream, so we'll handle this in the response
                console.log(`Referral bonus claimed: ${claimResult.bonusAwarded} scans awarded to ${claimResult.recipients.length} recipient(s)`)

                // Include bonus claim info in response for client-side notification
                bonusClaimInfo = {
                  claimed: true,
                  bonusAwarded: claimResult.bonusAwarded,
                  recipients: claimResult.recipients,
                  isMultiLevel: claimResult.isMultiLevel,
                  directBonus: claimResult.directBonus,
                  multiLevelBonus: claimResult.multiLevelBonus,
                }

                // Clear stats cache for affected users
                const { clearStatsCache } = await import('@/app/api/referral/stats/route')
                clearStatsCache(userId)
                claimResult.recipients.forEach(recipientId => clearStatsCache(recipientId))
              }
            } catch (error) {
              console.error('Error claiming referral bonus:', error)
              // Don't fail the scan if referral claim fails
            }
          }
        }

        console.log(`[Scan API] Scan completed: success=${result.success}, warnings=${result.contentWarningsGenerated ? 'yes' : 'no'}`)
        console.log(`[Scan API] Result structure:`, {
          hasSuccess: 'success' in result,
          hasBook: !!result.book,
          hasScan: !!result.scan,
          keys: Object.keys(result)
        })

        // Include rate limit info in response (re-fetch bonus scans in case they changed)
        const currentBonusScans = await getActiveBonusScans(userId)
        const updatedRateLimit = isUnlimited
          ? { effectiveLimit: 999, remaining: 999, resetAt: Date.now() + 86400000 }
          : await checkRateLimit(clientIP, baseLimit, timezone, userId, currentBonusScans)
        const responseResult = {
          ...result,
          rateLimit: {
            limit: updatedRateLimit.effectiveLimit,
            remaining: isUnlimited ? 999 : updatedRateLimit.remaining,
            resetAt: updatedRateLimit.resetAt,
            cost: scanCost,
            unlimited: isUnlimited,
          },
          bonusClaimInfo, // Include bonus claim info for client-side notification
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
