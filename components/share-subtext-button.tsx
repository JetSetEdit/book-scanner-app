"use client"

import { useState, useEffect } from "react"
import { Share2, Copy, Check, MessageCircle, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface ReferralData {
  code: string
  shareUrl: string
}

interface ReferralStats {
  activeBonusScans: number
  totalBonusScansEarned: number
  successfulReferrals: number
  pendingReferrals: number
  expiringBonuses: {
    expiringIn2Days: Array<{ amount: number; expiresAt: string }>
    expiringIn1Day: Array<{ amount: number; expiresAt: string }>
  }
  baseLimit: number
  effectiveLimit: number
}

export function ShareSubtextButton() {
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetchReferralData()
    fetchBonusStats()
  }, [])

  async function fetchReferralData() {
    try {
      const response = await fetch('/api/referral/generate')
      if (response.ok) {
        const data = await response.json()
        setReferralData(data)
      }
    } catch (error) {
      console.error('Error fetching referral code:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchBonusStats() {
    try {
      const response = await fetch('/api/referral/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching bonus stats:', error)
    }
  }

  async function handleCopy() {
    if (!referralData) return

    try {
      await navigator.clipboard.writeText(referralData.shareUrl)
      setCopied(true)
      toast.success("Link copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast.error("Failed to copy link")
    }
  }

  // Message template for sharing
  const getShareMessage = () => {
    if (!referralData) return ""
    return `Check out Subtext! Scan books to see content warnings before you read. Use my link: ${referralData.shareUrl}`
  }

  async function handleWhatsAppShare() {
    if (!referralData) return
    const message = getShareMessage()
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function handleTwitterShare() {
    if (!referralData) return
    const message = getShareMessage()
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function handleInstagramShare() {
    if (!referralData) return
    const message = getShareMessage()
    try {
      await navigator.clipboard.writeText(message)
      toast.success("Link and caption copied! Paste in Instagram")
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast.error("Failed to copy link")
    }
  }

  async function handleCopyLinkWithMessage() {
    if (!referralData) return
    const message = getShareMessage()
    try {
      await navigator.clipboard.writeText(message)
      toast.success("Link and message copied to clipboard!")
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast.error("Failed to copy link")
    }
  }

  async function handleShare() {
    if (!referralData) return

    const text = "Check out Subtext - scan books to see content warnings and age ratings before you read!"

    // Check if Web Share API is available (mobile browsers)
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Subtext - Content Warnings for Books",
          text: text,
          url: referralData.shareUrl,
        })
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error)
        }
      }
    } else {
      // Fallback: Copy to clipboard
      handleCopy()
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Share2 className="h-4 w-4" />
            Share Subtext
          </CardTitle>
          <CardDescription>
            Loading your referral link...
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!referralData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Share2 className="h-4 w-4" />
            Share Subtext
          </CardTitle>
          <CardDescription>
            Unable to load referral link. Please try again later.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Share2 className="h-4 w-4" />
          Share Subtext
        </CardTitle>
        <CardDescription>
          Earn 3 bonus scans for each friend who scans their first book with your link. (+ unlock more when they invite others)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Referral Link */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Your referral link</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={referralData.shareUrl}
              className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-muted/50 font-mono text-xs"
            />
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1.5" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Share Button with Platform Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="w-full"
              size="sm"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleWhatsAppShare}>
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleTwitterShare}>
              <Twitter className="h-4 w-4 mr-2" />
              Twitter/X
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleInstagramShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Instagram (Copy)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyLinkWithMessage}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link & Message
            </DropdownMenuItem>
            {navigator.share && (
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Native Share
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Summary View */}
        {stats && (
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Base scans:</span>
              <span className="font-medium">{stats.baseLimit}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Bonus scans:</span>
              <span className="font-medium text-primary">+{stats.activeBonusScans}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-medium pt-1 border-t border-border">
              <span>Total available today:</span>
              <span>{stats.effectiveLimit}</span>
            </div>
            {stats.successfulReferrals > 0 && (
              <div className="text-xs text-muted-foreground pt-1">
                {stats.successfulReferrals} successful {stats.successfulReferrals === 1 ? 'referral' : 'referrals'}
              </div>
            )}
            
            {/* Expiration Warnings */}
            {stats.expiringBonuses.expiringIn1Day.length > 0 && (
              <div className="text-xs text-orange-600 dark:text-orange-400 font-medium pt-1 border-t border-border">
                ⚠️ {stats.expiringBonuses.expiringIn1Day.reduce((sum, b) => sum + b.amount, 0)} bonus scans expire tomorrow
              </div>
            )}
            {stats.expiringBonuses.expiringIn2Days.length > 0 && stats.expiringBonuses.expiringIn1Day.length === 0 && (
              <div className="text-xs text-muted-foreground pt-1 border-t border-border">
                {stats.expiringBonuses.expiringIn2Days.reduce((sum, b) => sum + b.amount, 0)} bonus scans expire in 2 days
              </div>
            )}
            
            {/* Expanded View Toggle */}
            {(stats.successfulReferrals > 0 || stats.pendingReferrals > 0 || stats.totalBonusScansEarned > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="w-full mt-2 text-xs"
              >
                {expanded ? 'Hide Details' : 'View Details'}
              </Button>
            )}
            
            {/* Expanded View */}
            {expanded && (
              <div className="space-y-2 pt-2 border-t border-border text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total bonus scans earned:</span>
                  <span className="font-medium">{stats.totalBonusScansEarned}</span>
                </div>
                {stats.pendingReferrals > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pending referrals:</span>
                    <span className="font-medium">{stats.pendingReferrals} clicks (waiting for first scan)</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
