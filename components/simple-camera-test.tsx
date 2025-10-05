"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, CameraOff, AlertCircle } from "lucide-react"

export function SimpleCameraTest() {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startScanning = async () => {
    setError(null)
    try {
      console.log("[TEST] Requesting camera access...")
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })

      console.log("[TEST] Camera stream obtained:", stream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)
        console.log("[TEST] Video element updated")
      }
    } catch (err) {
      console.error("[TEST] Camera access error:", err)
      setError("Unable to access camera. Please check permissions and try again.")
    }
  }

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
        {isScanning ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }} // Mirror the video like a selfie camera
            onLoadedMetadata={() => console.log("[TEST] Video metadata loaded")}
            onCanPlay={() => console.log("[TEST] Video can play")}
            onError={(e) => console.error("[TEST] Video error:", e)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Camera preview will appear here</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        {!isScanning ? (
          <Button onClick={startScanning} className="flex-1" size="lg">
            <Camera className="mr-2 h-4 w-4" />
            Start Camera (Test)
          </Button>
        ) : (
          <Button onClick={stopScanning} variant="destructive" className="flex-1" size="lg">
            <CameraOff className="mr-2 h-4 w-4" />
            Stop Camera
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        This is a simple camera test. Check the browser console for logs.
      </p>
    </div>
  )
}
