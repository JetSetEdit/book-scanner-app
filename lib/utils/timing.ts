/**
 * Performance timing utilities for measuring scan flow
 */

export interface TimingResult {
  startTime: number
  endTime: number
  duration: number
  stages: Record<string, number>
}

class PerformanceTimer {
  private startTime: number = 0
  private stages: Map<string, number> = new Map()
  private currentStage: string | null = null
  private stageStartTime: number = 0

  start() {
    this.startTime = performance.now()
    this.stages.clear()
    this.currentStage = null
    return this
  }

  markStage(stageName: string) {
    const now = performance.now()
    
    // Record duration of previous stage
    if (this.currentStage) {
      const duration = now - this.stageStartTime
      this.stages.set(this.currentStage, duration)
    }
    
    // Start new stage
    this.currentStage = stageName
    this.stageStartTime = now
  }

  end(): TimingResult {
    const endTime = performance.now()
    
    // Mark final stage if there's one active
    if (this.currentStage) {
      const duration = endTime - this.stageStartTime
      this.stages.set(this.currentStage, duration)
    }
    
    const duration = endTime - this.startTime
    
    return {
      startTime: this.startTime,
      endTime,
      duration,
      stages: Object.fromEntries(this.stages)
    }
  }

  getCurrentDuration(): number {
    return performance.now() - this.startTime
  }
}

// Singleton instance
let timer: PerformanceTimer | null = null

export function startTiming(): PerformanceTimer {
  timer = new PerformanceTimer().start()
  return timer
}

export function markStage(stageName: string) {
  if (timer) {
    timer.markStage(stageName)
  }
}

export function endTiming(): TimingResult | null {
  if (timer) {
    const result = timer.end()
    timer = null
    return result
  }
  return null
}

export function getCurrentDuration(): number {
  return timer ? timer.getCurrentDuration() : 0
}

/**
 * Format timing result for display
 */
export function formatTiming(result: TimingResult): string {
  const total = result.duration.toFixed(0)
  const stages = Object.entries(result.stages)
    .map(([name, duration]) => `  ${name}: ${duration.toFixed(0)}ms`)
    .join('\n')
  
  return `Total: ${total}ms\n${stages}`
}

