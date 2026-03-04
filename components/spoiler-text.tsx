"use client"

import React from "react"

/**
 * Parses text for Reddit-style spoiler tags and renders hover-to-reveal spans.
 * Supports: [text](/spoiler), [text](#spoiler), [text](/s), [text](#s)
 */
const SPOILER_RE = /\[([^\]]*)\]\((?:\/|#)(?:spoiler|s)\)/g

export function SpoilerText({ text }: { text: string }) {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  SPOILER_RE.lastIndex = 0
  while ((match = SPOILER_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    parts.push(
      <span key={match.index} className="spoiler-tag" title="Spoiler — hover to reveal">
        {match[1]}
      </span>
    )
    lastIndex = SPOILER_RE.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  if (parts.length === 0) return <>{text}</>
  return <>{parts}</>
}
