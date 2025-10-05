"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, CameraOff, AlertCircle } from "lucide-react"

export function SimpleCameraTest() {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [buttonClicked, setButtonClicked] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startScanning = async () => {
    console.log("[TEST] startScanning called")
    setButtonClicked(true)
    setError(null)
    try {
      console.log("[TEST] Requesting camera access...")
      console.log("[TEST] navigator.mediaDevices available:", !!navigator.mediaDevices)
      console.log("[TEST] getUserMedia available:", !!navigator.mediaDevices?.getUserMedia)
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })

      console.log("[TEST] Camera stream obtained:", stream)
      console.log("[TEST] Stream tracks:", stream.getTracks())
      console.log("[TEST] Stream active:", stream.active)
      
      if (videoRef.current) {
        console.log("[TEST] Setting video srcObject...")
        videoRef.current.srcObject = stream
        streamRef.current = stream
        console.log("[TEST] Setting isScanning to true...")
        setIsScanning(true)
        console.log("[TEST] Video element updated")
        
        // Force video to play
        videoRef.current.onloadedmetadata = () => {
          console.log("[TEST] Video metadata loaded, dimensions:", videoRef.current?.videoWidth, "x", videoRef.current?.videoHeight)
          videoRef.current?.play().then(() => {
            console.log("[TEST] Video play started")
          }).catch((err) => {
            console.error("[TEST] Video play failed:", err)
          })
        }
        
        videoRef.current.oncanplay = () => {
          console.log("[TEST] Video can play")
        }
        
        videoRef.current.onerror = (e) => {
          console.error("[TEST] Video error:", e)
        }
      } else {
        console.error("[TEST] videoRef.current is null!")
      }
    } catch (err) {
      console.error("[TEST] Camera access error:", err)
      setError(`Unable to access camera: ${err.message}`)
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
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
        {isScanning ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className="w-full h-full object-cover bg-black"
            style={{ 
              transform: 'scaleX(-1)',
              minHeight: '200px',
              minWidth: '100%'
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Camera preview will appear here</p>
            </div>
          </div>
        )}
        
        {/* Debug info */}
        {(isScanning || buttonClicked) && (
          <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
            <div>Button Clicked: {buttonClicked ? 'Yes' : 'No'}</div>
            <div>Scanning: {isScanning ? 'Yes' : 'No'}</div>
            <div>Video Element: {videoRef.current ? 'Exists' : 'Missing'}</div>
            <div>Stream: {streamRef.current ? 'Active' : 'None'}</div>
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
