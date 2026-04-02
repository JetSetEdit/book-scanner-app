"use client"

/**
 * Sandbox: Scan progress simulation
 * Simulates the scan progress indicator without calling the scan API.
 * Use for demos, UI development, and testing the progress flow.
 */

import { useState, useRef, useCallback, useEffect } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCurrentStage } from "@/lib/utils/scan-progress-mapper"
import { ScanningAnimation } from "@/components/scanning-animation"
import { cn } from "@/lib/utils"
import {
  SCAN_FIRST_MESSAGE,
  getScanLastMessage,
  getMiddleFlavourMessages,
  FLAVOUR_MESSAGE_INTERVAL_MS,
} from "@/lib/scan-loading-messages"

// Same formatting as scan page so the progress text matches production
function formatStatusMessage(message: string): string {
  let cleaned = message.replace(/📖|📝|🔍|🤖|⏳|✅|❌|⚠️|💡|📋|🔄|📥|🌐|💾|📚|📄|🚀/g, "").trim()
  if (message.match(/Checking for:/i)) return "analyzing_categories"
  const replacements: [RegExp, string][] = [
    [/validating isbn and checking local database/i, "Searching our library..."],
    [/checking local database for existing book/i, "Looking for this book..."],
    [/database lookup completed/i, "Database lookup completed"],
    [/found metadata for "([^"]+)"/i, "Found book: $1"],
    [/saving to database/i, "Saving book information..."],
    [/book for analysis/i, "Preparing book for analysis..."],
    [/description for analysis: (\d+) characters/i, "Analyzing $1 characters..."],
    [/analyzing content for warnings/i, "Analyzing content for warnings..."],
    [/reading description/i, "Reading description..."],
    [/checking for:/i, "Checking for:"],
    [/running second analysis pass/i, "Running second analysis pass..."],
    [/cross-check complete/i, "Cross-check complete"],
    [/found (\d+) warnings/i, "Found $1 warnings"],
    [/verifying.*warnings/i, "Verifying warnings..."],
    [/verification complete/i, "Verification complete"],
    [/saving results/i, "Saving results..."],
    [/saved (\d+) content warnings/i, "Saved content warnings"],
    [/scan completed successfully/i, "Scan completed successfully"],
    [/finding your book/i, "Finding your book..."],
    [/scan complete.*warnings found/i, "Scan complete — 3 warnings found"],
  ]
  for (const [pattern, replacement] of replacements) {
    cleaned = cleaned.replace(pattern, replacement)
  }
  if (cleaned.length > 0) cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  return cleaned
}

function buildSimulationMessages(mode: "quick" | "deep"): string[] {
  const middle = getMiddleFlavourMessages(mode)
  return [SCAN_FIRST_MESSAGE, ...middle, getScanLastMessage(3)]
}

export default function SandboxScanProgressPage() {
  const [loading, setLoading] = useState(false)
  const [statusUpdates, setStatusUpdates] = useState<string[]>([])
  const [complete, setComplete] = useState(false)
  const [mode, setMode] = useState<"quick" | "deep">("quick")
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopSimulation = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setLoading(false)
  }, [])

  const startSimulation = useCallback(() => {
    stopSimulation()
    const messages = buildSimulationMessages(mode)
    setStatusUpdates([])
    setComplete(false)
    setLoading(true)

    let index = 0
    timerRef.current = setInterval(() => {
      if (index >= messages.length) {
        stopSimulation()
        setComplete(true)
        return
      }
      setStatusUpdates((prev) => [...prev, messages[index]])
      index += 1
    }, FLAVOUR_MESSAGE_INTERVAL_MS)
  }, [mode, stopSimulation])

  const reset = useCallback(() => {
    stopSimulation()
    setStatusUpdates([])
    setComplete(false)
  }, [stopSimulation])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const currentStage = getCurrentStage(statusUpdates, loading)
  const shouldShowProgress = (loading || statusUpdates.length > 0) && !complete
  const latestMessage = statusUpdates[statusUpdates.length - 1] || ""
  const cleanMessage = formatStatusMessage(latestMessage)

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Scan progress sandbox</h1>
          <p className="text-sm text-muted-foreground">
            Simulates the scan progress indicator without calling the API.
          </p>
        </div>
        <Link
          href="/scan"
          className="text-sm text-muted-foreground underline hover:text-foreground"
        >
          Back to Scan
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMode("quick")}
            disabled={loading}
            className={cn(mode === "quick" && "ring-2 ring-primary")}
          >
            Quick
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMode("deep")}
            disabled={loading}
            className={cn(mode === "deep" && "ring-2 ring-primary")}
          >
            Deep
          </Button>
        </div>
        <Button onClick={startSimulation} disabled={loading}>
          {loading ? "Running…" : "Start simulation"}
        </Button>
        {(loading || statusUpdates.length > 0) && (
          <Button variant="ghost" size="sm" onClick={loading ? stopSimulation : reset}>
            {loading ? "Stop" : "Reset"}
          </Button>
        )}
      </div>

      {complete && (
        <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/5 p-4 text-sm text-green-800 dark:text-green-200">
          Simulation finished. Click Reset then Start to run again.
        </div>
      )}

      {shouldShowProgress && currentStage && (
        <div className="mb-6 rounded-lg border p-6 bg-muted/30 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <currentStage.icon className="h-5 w-5 text-primary" />
                {loading && (
                  <Loader2 className="absolute -top-1 -right-1 h-3 w-3 animate-spin text-primary" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{currentStage.displayText}</p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-secondary">
                  <div
                    className="h-1.5 rounded-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${(currentStage.stage / 4) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {cleanMessage === "analyzing_categories" ? (
              <div className="border-t border-border/50 pt-3">
                <ScanningAnimation
                  isAnalyzing={true}
                  categories={latestMessage
                    .replace(/.*Checking for:/i, "")
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)}
                />
              </div>
            ) : (
              cleanMessage && (
                <div className="border-t border-border/50 pt-3">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Current step:</span> {cleanMessage}
                  </p>
                </div>
              )
            )}

            {statusUpdates.length > 1 && (
              <div className="border-t border-border/50 pt-2">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Recent steps:</p>
                <ul className="space-y-1">
                  {statusUpdates.slice(-3).map((update, idx) => {
                    const cleanUpdate = formatStatusMessage(update)
                    if (!cleanUpdate) return null
                    const isLatest = idx === statusUpdates.slice(-3).length - 1
                    return (
                      <li
                        key={idx}
                        className={cn(
                          "flex items-start gap-2 text-xs text-muted-foreground",
                          isLatest && "font-medium text-foreground"
                        )}
                      >
                        <span className="mt-0.5 text-muted-foreground">•</span>
                        <span>{cleanUpdate}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {!shouldShowProgress && !complete && statusUpdates.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Choose Quick or Deep, then click Start simulation to see the progress indicator.
        </div>
      )}
    </div>
  )
}
