"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, CameraOff, AlertCircle, CheckCircle } from "lucide-react"
import { BrowserMultiFormatReader } from "@zxing/library"

interface BarcodeScannerProps {
  onScanSuccess: (isbn: string) => void
}

export function BarcodeScanner({ onScanSuccess }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const scanningIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const startScanning = async () => {
    setError(null)
    try {
      // Stop any existing camera streams first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      
      // Also stop any other camera streams that might be running
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      console.log("[v0] Available video devices:", videoDevices.length)
      
      console.log("[v0] Requesting camera access...")
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })

      console.log("[v0] Camera stream obtained:", stream)
      
      // Set scanning state first to render the video element
      setIsScanning(true)
      setHasPermission(true)
      streamRef.current = stream
      
      // Wait for React to render the video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          console.log("[v0] Video element updated")
          
          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            console.log("[v0] Video metadata loaded")
            videoRef.current?.play().then(() => {
              console.log("[v0] Video play started successfully")
            }).catch((err) => {
              console.error("[v0] Video play failed:", err)
            })
            
            // Initialize barcode reader but don't let it control the video
            try {
              const codeReader = new BrowserMultiFormatReader()
              codeReaderRef.current = codeReader
              console.log("[v0] Barcode reader initialized")
              
              // Start manual frame capture scanning
              setTimeout(() => {
                startManualBarcodeScanning()
              }, 2000) // Wait 2 seconds for video to be completely stable
            } catch (err) {
              console.error("[v0] Error initializing barcode reader:", err)
              setError("Barcode scanning not available, but camera is working")
            }
          }
          
          videoRef.current.oncanplay = () => {
            console.log("[v0] Video can play")
          }
          
          videoRef.current.onerror = (e) => {
            console.error("[v0] Video error:", e)
          }
          
          videoRef.current.onpause = () => {
            console.log("[v0] Video paused")
          }
          
          videoRef.current.onended = () => {
            console.log("[v0] Video ended")
          }
        } else {
          console.error("[v0] videoRef.current is still null after timeout!")
        }
      }, 100) // Small delay to let React render
    } catch (err) {
      console.error("[v0] Camera access error:", err)
      setError("Unable to access camera. Please check permissions and try again.")
      setHasPermission(false)
    }
  }

  const startManualBarcodeScanning = () => {
    if (!videoRef.current || !codeReaderRef.current) {
      console.log("[v0] Cannot start manual barcode scanning - missing video or codeReader")
      return
    }

    console.log("[v0] Starting manual barcode scanning...")

    const scanBarcode = async () => {
      try {
        if (videoRef.current && codeReaderRef.current && !videoRef.current.paused) {
          // Show detecting indicator
          setIsDetecting(true)
          
          // Create a canvas to capture the current video frame
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          
          if (context && videoRef.current.videoWidth > 0) {
            canvas.width = videoRef.current.videoWidth
            canvas.height = videoRef.current.videoHeight
            
            // Draw the current video frame to canvas
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
            
            // Convert canvas to image data and scan it
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
            const result = await codeReaderRef.current.decodeFromImageData(imageData)
            
            if (result && result.getText()) {
              const scannedCode = result.getText()
              
              // Avoid duplicate scans
              if (scannedCode !== lastScannedCode) {
                setLastScannedCode(scannedCode)
                console.log("[v0] Barcode scanned:", scannedCode)
                
                // For testing: accept any barcode, not just ISBNs
                console.log("[v0] Any barcode found:", scannedCode)
                onScanSuccess(scannedCode)
                stopScanning()
              }
            }
          }
          
          // Hide detecting indicator after a short delay
          setTimeout(() => setIsDetecting(false), 200)
        }
      } catch (err) {
        // Ignore scanning errors - they're expected when no barcode is found
        // Only log occasionally to avoid spam
        if (Math.random() < 0.01) {
          console.log("[v0] Manual scanning (no barcode found)")
        }
        setIsDetecting(false)
      }
    }

    // Scan every 2000ms (even slower to avoid conflicts)
    scanningIntervalRef.current = setInterval(scanBarcode, 2000)
    console.log("[v0] Manual barcode scanning interval started")
  }

  const isValidISBN = (code: string): boolean => {
    // Remove any non-digit characters
    const cleanCode = code.replace(/[^\d]/g, '')
    
    // Check if it's 10 or 13 digits (ISBN format)
    return cleanCode.length === 10 || cleanCode.length === 13
  }

  const stopScanning = () => {
    // Stop barcode scanning
    if (scanningIntervalRef.current) {
      clearInterval(scanningIntervalRef.current)
      scanningIntervalRef.current = null
    }

    // Clean up code reader
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
      codeReaderRef.current = null
    }

    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
    setLastScannedCode(null)
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
            className="w-full h-full"
            style={{ 
              transform: 'scaleX(-1)',
              backgroundColor: 'black',
              objectFit: 'cover'
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

        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`w-64 h-40 border-2 rounded-lg shadow-lg transition-colors ${
              isDetecting ? 'border-green-500 bg-green-500/10' : 'border-primary'
            }`}>
              <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-lg ${
                isDetecting ? 'border-green-500' : 'border-primary'
              }`} />
              <div className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-lg ${
                isDetecting ? 'border-green-500' : 'border-primary'
              }`} />
              <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-lg ${
                isDetecting ? 'border-green-500' : 'border-primary'
              }`} />
              <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-lg ${
                isDetecting ? 'border-green-500' : 'border-primary'
              }`} />
            </div>
          </div>
        )}

        {/* Scanning indicator */}
        {isDetecting && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
            Scanning...
          </div>
        )}

        {lastScannedCode && (
          <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-2 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Barcode Found!</span>
          </div>
        )}

        {/* Debug info for main scanner */}
        {isScanning && (
          <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
            <div>Scanning: {isScanning ? 'Yes' : 'No'}</div>
            <div>Video Element: {videoRef.current ? 'Exists' : 'Missing'}</div>
            <div>Stream: {streamRef.current ? 'Active' : 'None'}</div>
            <div>Video Playing: {videoRef.current?.paused === false ? 'Yes' : 'No'}</div>
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
            Start Camera
          </Button>
        ) : (
          <Button onClick={stopScanning} variant="destructive" className="flex-1" size="lg">
            <CameraOff className="mr-2 h-4 w-4" />
            Stop Camera
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground text-center">Position the barcode within the frame to scan</p>
      
      <div className="text-center">
        <a 
          href="/test-barcodes" 
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Need test barcodes? Click here for test page
        </a>
      </div>
    </div>
  )
}
