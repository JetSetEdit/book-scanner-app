"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Volume2 } from "lucide-react"

interface AccessibleAudioPlayerProps {
  audioUrl: string
  duration?: number
  transcript: string
  briefing: string
}

export function AccessibleAudioPlayer({
  audioUrl,
  duration,
  transcript,
  briefing,
}: AccessibleAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio(audioUrl)
    audioRef.current = audio

    const updateTime = () => setCurrentTime(audio.currentTime)
    const handleEnd = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }
    const handleError = () => {
      setError("Failed to load audio")
      setIsPlaying(false)
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("ended", handleEnd)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("ended", handleEnd)
      audio.removeEventListener("error", handleError)
      audio.pause()
      audio.src = ""
    }
  }, [audioUrl])

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch((err) => {
        setError("Failed to play audio")
        console.error("Audio play error:", err)
      })
      setIsPlaying(true)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="border rounded-lg p-4 bg-slate-50">
      <div className="flex items-center gap-4 mb-4">
        <Button
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
          variant="outline"
          size="sm"
          disabled={!!error}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Play className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Volume2 className="h-4 w-4" aria-hidden="true" />
            <span>Content Briefing</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-600 transition-all"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <span className="text-xs text-slate-500 min-w-[50px] text-right">
              {formatTime(currentTime)}
              {duration && ` / ${formatTime(duration)}`}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 mb-2" role="alert">
          {error}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-slate-200">
        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-slate-700 hover:text-slate-900">
            View Transcript
          </summary>
          <div className="mt-2 p-3 bg-white rounded text-slate-600">
            <p className="mb-2 font-medium text-slate-800">{briefing}</p>
            {transcript !== briefing && (
              <p className="text-xs text-slate-500 whitespace-pre-wrap">{transcript}</p>
            )}
          </div>
        </details>
      </div>
    </div>
  )
}
















