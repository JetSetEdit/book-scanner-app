"use client"

import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

interface ThumbsButtonsProps {
  warningId: string
  helpfulCount: number
  notHelpfulCount: number
  userValidation?: boolean | null
}

const DEVICE_ID_KEY = "subtext_device_id"
const VOTES_KEY = "subtext_warning_votes_v1"

function getOrCreateDeviceId(): string | null {
  if (typeof window === "undefined") return null
  try {
    const existing = window.localStorage.getItem(DEVICE_ID_KEY)
    if (existing && existing.trim().length > 0) return existing.trim()
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
    window.localStorage.setItem(DEVICE_ID_KEY, id)
    return id
  } catch {
    return null
  }
}

type StoredVote = Record<string, boolean>

function readStoredVotes(): StoredVote {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(VOTES_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return {}
    return parsed as StoredVote
  } catch {
    return {}
  }
}

function writeStoredVotes(votes: StoredVote) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(VOTES_KEY, JSON.stringify(votes))
  } catch {
    // ignore
  }
}

export function ThumbsButtons({ warningId, helpfulCount, notHelpfulCount, userValidation }: ThumbsButtonsProps) {
  const router = useRouter()
  
  // Local state for optimistic updates
  const [localCounts, setLocalCounts] = useState({
    helpful: helpfulCount,
    notHelpful: notHelpfulCount
  })
  const [localUserValidation, setLocalUserValidation] = useState<boolean | null | undefined>(userValidation)

  const deviceId = useMemo(() => getOrCreateDeviceId(), [])

  // Hydrate per-warning vote state from localStorage (no-auth persistence)
  useEffect(() => {
    const votes = readStoredVotes()
    if (warningId in votes) {
      setLocalUserValidation(votes[warningId])
    } else {
      setLocalUserValidation(null)
    }
     
  }, [warningId])
  
  // If server counts change on refresh, keep local counts in sync
  useEffect(() => {
    setLocalCounts({ helpful: helpfulCount, notHelpful: notHelpfulCount })
  }, [helpfulCount, notHelpfulCount])
  
  const handleValidate = async (isHelpful: boolean) => {
    const prevVote = localUserValidation ?? null
    try {
      console.log(`👍 Thumbs button clicked: ${warningId}, isHelpful: ${isHelpful}`)
      
      if (!deviceId) {
        alert("Unable to record feedback in this browser.")
        return
      }

      // Optimistic update for toggle-off + switch
      if (prevVote === isHelpful) {
        // toggle off
        setLocalCounts(prev => ({
          helpful: prev.helpful - (isHelpful ? 1 : 0),
          notHelpful: prev.notHelpful - (!isHelpful ? 1 : 0),
        }))
        setLocalUserValidation(null)
      } else if (prevVote === null) {
        // new vote
        setLocalCounts(prev => ({
          helpful: prev.helpful + (isHelpful ? 1 : 0),
          notHelpful: prev.notHelpful + (!isHelpful ? 1 : 0),
        }))
        setLocalUserValidation(isHelpful)
      } else {
        // switch vote
        setLocalCounts(prev => ({
          helpful: prev.helpful + (isHelpful ? 1 : -1),
          notHelpful: prev.notHelpful + (!isHelpful ? 1 : -1),
        }))
        setLocalUserValidation(isHelpful)
      }
      
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )
      
      const result = await Promise.race([
        fetch('/api/validate-warning', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ warningId, isHelpful, deviceId })
        }).then(res => res.json()),
        timeoutPromise
      ])
      
      console.log("✅ Validation result:", result)
      
      if (result && typeof result === 'object' && 'error' in result) {
        console.error("❌ Validation error:", result.error)
        // Revert optimistic update on error
        setLocalCounts({ helpful: helpfulCount, notHelpful: notHelpfulCount })
        setLocalUserValidation(prevVote)
        alert(`Error: ${result.error}`)
      } else {
        // Reconcile with server and persist per-device vote state locally
        const serverHelpful = typeof result.helpful_count === "number" ? result.helpful_count : localCounts.helpful
        const serverNotHelpful = typeof result.not_helpful_count === "number" ? result.not_helpful_count : localCounts.notHelpful
        const serverVote = result.user_vote === true ? true : result.user_vote === false ? false : null

        setLocalCounts({ helpful: serverHelpful, notHelpful: serverNotHelpful })
        setLocalUserValidation(serverVote)

        const votes = readStoredVotes()
        if (serverVote === null) {
          delete votes[warningId]
        } else {
          votes[warningId] = serverVote
        }
        writeStoredVotes(votes)

        console.log("✅ Validation successful! Refreshing page...")
        router.refresh()
      }
    } catch (error) {
      console.error("❌ Unexpected error:", error)
      // Revert optimistic update on error
      setLocalCounts({ helpful: helpfulCount, notHelpful: notHelpfulCount })
      setLocalUserValidation(prevVote)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage === 'Request timeout') {
        alert('Request timed out. Please try again.')
      } else if (errorMessage === 'Failed to fetch') {
        alert('Network error. Please check your connection and try again.')
      } else {
        alert(`Unexpected error: ${errorMessage}`)
      }
    }
  }

  return (
    <div className="flex items-center gap-2 pt-2 border-t">
      <span className="text-sm text-muted-foreground">Was this helpful?</span>
      <div className="flex items-center gap-1">
        <Button
          variant={localUserValidation === true ? "default" : "outline"}
          size="sm"
          onClick={() => handleValidate(true)}
          className="gap-1"
          aria-label="Mark as helpful"
        >
          <ThumbsUp className="h-3 w-3" />
          <span className="text-xs">{localCounts.helpful}</span>
        </Button>
        <Button
          variant={localUserValidation === false ? "default" : "outline"}
          size="sm"
          onClick={() => handleValidate(false)}
          className="gap-1"
          aria-label="Mark as not helpful"
        >
          <ThumbsDown className="h-3 w-3" />
          <span className="text-xs">{localCounts.notHelpful}</span>
        </Button>
        {(localUserValidation === true || localUserValidation === false) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleValidate(localUserValidation)}
            className="text-xs text-muted-foreground"
            aria-label="Undo your vote"
            title="Undo your vote"
          >
            Undo
          </Button>
        )}
      </div>
    </div>
  )
}
