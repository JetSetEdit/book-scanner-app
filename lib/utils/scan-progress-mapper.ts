import { Search, Sparkles, Shield, CheckCircle } from "lucide-react"
import { LucideIcon } from "lucide-react"

export type ScanStage = {
  stage: 1 | 2 | 3 | 4
  displayText: string
  icon: LucideIcon
}

/**
 * Maps verbose backend progress messages to simplified user-facing stages
 * Returns null if the message indicates ambiguous results (should show selection UI instead)
 */
export function mapProgressToStage(message: string): ScanStage | null {
  const lowerMessage = message.toLowerCase()

  // Special case: Ambiguous results - return null to hide loader
  if (
    lowerMessage.includes('possible matches') ||
    lowerMessage.includes('ambiguous') ||
    lowerMessage.includes('please select')
  ) {
    return null
  }

  // Stage 1: Search & Metadata Fetching
  if (
    lowerMessage.includes('validating') ||
    lowerMessage.includes('checking local database') ||
    lowerMessage.includes('book found in local database') ||
    lowerMessage.includes('fetching book metadata') ||
    lowerMessage.includes('fetching from external') ||
    lowerMessage.includes('found metadata') ||
    lowerMessage.includes('saving to database') ||
    lowerMessage.includes('found book') ||
    lowerMessage.includes('book not found locally') ||
    lowerMessage.includes('external api fetch') ||
    lowerMessage.includes('calling fetchbookbyisbn') ||
    lowerMessage.includes('fetched data from')
  ) {
    return {
      stage: 1,
      displayText: 'Finding book information...',
      icon: Search,
    }
  }

  // Stage 2: Analysis (The AI Step)
  if (
    lowerMessage.includes('analyzing') ||
    lowerMessage.includes('starting ai content analysis') ||
    lowerMessage.includes('calling analyzebookwithmultimodel') ||
    lowerMessage.includes('analyzing with') ||
    lowerMessage.includes('ai analysis') ||
    lowerMessage.includes('deep ai') ||
    lowerMessage.includes('web search') ||
    lowerMessage.includes('initiating') ||
    lowerMessage.includes('ai found book') ||
    lowerMessage.includes('ai is reading') ||
    lowerMessage.includes('performing comprehensive') ||
    lowerMessage.includes('deep search') ||
    lowerMessage.includes('checking if description is sufficient') ||
    lowerMessage.includes('description for analysis') ||
    lowerMessage.includes('using description')
  ) {
    return {
      stage: 2,
      displayText: 'Analyzing content for warnings...',
      icon: Sparkles,
    }
  }

  // Stage 3: Verification
  if (
    lowerMessage.includes('verifying') ||
    lowerMessage.includes('checking for existing') ||
    lowerMessage.includes('double-checking') ||
    lowerMessage.includes('initial text analysis safe')
  ) {
    return {
      stage: 3,
      displayText: 'Verifying safety triggers...',
      icon: Shield,
    }
  }

  // Stage 4: Completion
  if (
    lowerMessage.includes('saving') ||
    lowerMessage.includes('saved') ||
    lowerMessage.includes('complete') ||
    lowerMessage.includes('generated') ||
    lowerMessage.includes('finalizing') ||
    lowerMessage.includes('scan completed') ||
    lowerMessage.includes('ai analysis complete') ||
    lowerMessage.includes('warnings generated') ||
    lowerMessage.includes('deleted existing') ||
    lowerMessage.includes('saved content warnings')
  ) {
    return {
      stage: 4,
      displayText: 'Saving results...',
      icon: CheckCircle,
    }
  }

  // Default fallback: If message doesn't match any stage, assume it's still in analysis
  return {
    stage: 2,
    displayText: 'AI is reading the synopsis...',
    icon: Sparkles,
  }
}

/**
 * Gets the highest stage reached from a list of progress messages
 */
export function getCurrentStage(messages: string[]): ScanStage | null {
  if (messages.length === 0) return null

  // Check for ambiguous results first
  for (const message of messages) {
    const stage = mapProgressToStage(message)
    if (stage === null) return null // Ambiguous - hide loader
  }

  // Find the highest stage reached
  let highestStage: ScanStage | null = null
  for (const message of messages) {
    const stage = mapProgressToStage(message)
    if (stage && (!highestStage || stage.stage > highestStage.stage)) {
      highestStage = stage
    }
  }

  return highestStage || {
    stage: 1,
    displayText: 'Searching global archives...',
    icon: Search,
  }
}
