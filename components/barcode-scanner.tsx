"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, CameraOff, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
// Import ZXing library with error handling
let BrowserMultiFormatReader: any = null
try {
  const zxing = require("@zxing/library")
  BrowserMultiFormatReader = zxing.BrowserMultiFormatReader
  console.log("[v0] ZXing library loaded successfully")
} catch (error) {
  console.error("[v0] Failed to load ZXing library:", error)
}

interface BarcodeScannerProps {
  onScanSuccess: (isbn: string) => void
}

export function BarcodeScanner({ onScanSuccess }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false) // Loading state for processing
  const [statusMessage, setStatusMessage] = useState<string>("") // Status messages
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const scanningIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const startScanning = async () => {
    setError(null)
    setStatusMessage("Initializing camera...")
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
      
      setStatusMessage("Requesting camera permission...")
      console.log("[v0] Requesting camera access...")
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })

      console.log("[v0] Camera stream obtained:", stream)
      setStatusMessage("Setting up camera...")
      
      // Set scanning state first to render the video element
      setIsScanning(true)
      setHasPermission(true)
      streamRef.current = stream
      
      // Wait for React to render the video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          console.log("[v0] Video element updated")
          setStatusMessage("Starting video feed...")
          
          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            console.log("[v0] Video metadata loaded")
            setStatusMessage("Initializing barcode scanner...")
            videoRef.current?.play().then(() => {
              console.log("[v0] Video play started successfully")
            }).catch((err) => {
              console.error("[v0] Video play failed:", err)
            })
            
            // Initialize barcode reader but don't let it control the video
            if (!BrowserMultiFormatReader) {
              console.error("[v0] BrowserMultiFormatReader is not available")
              setError("Barcode scanning library not loaded, but camera is working")
              setStatusMessage("")
              return
            }
            
            try {
              console.log("[v0] Attempting to initialize BrowserMultiFormatReader...")
              const codeReader = new BrowserMultiFormatReader()
              codeReaderRef.current = codeReader
              console.log("[v0] Barcode reader initialized successfully:", codeReader)
              setStatusMessage("Ready to scan! Point camera at a barcode")
              
              // Start manual frame capture scanning
              setTimeout(() => {
                console.log("[v0] Starting manual barcode scanning after delay...")
                startManualBarcodeScanning()
              }, 2000) // Wait 2 seconds for video to be completely stable
            } catch (err) {
              console.error("[v0] Error initializing barcode reader:", err)
              console.error("[v0] Error details:", err.message)
              setError("Barcode scanning not available, but camera is working")
              setStatusMessage("")
            }
          }
          
          videoRef.current.oncanplay = () => {
            console.log("[v0] Video can play")
          }
          
          videoRef.current.onerror = (e) => {
            console.error("[v0] Video error:", e)
          }
          
          videoRef.current.onpause = () => {
            console.log("[v0] Video paused - attempting to restart")
            // Try to restart the video if it gets paused
            setTimeout(() => {
              if (videoRef.current && videoRef.current.paused) {
                console.log("[v0] Restarting paused video")
                videoRef.current.play().catch(err => {
                  console.error("[v0] Failed to restart video:", err)
                })
              }
            }, 100)
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
      console.log("[v0] scanBarcode function called")
      try {
        if (videoRef.current && codeReaderRef.current && !videoRef.current.paused) {
          console.log("[v0] Starting barcode detection...")
          // Show detecting indicator
          setIsDetecting(true)
          
          // Create a canvas to capture the current video frame
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          
          if (context && videoRef.current.videoWidth > 0) {
            console.log("[v0] Video dimensions:", videoRef.current.videoWidth, "x", videoRef.current.videoHeight)
            canvas.width = videoRef.current.videoWidth
            canvas.height = videoRef.current.videoHeight
            
            // Draw the current video frame to canvas
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
            console.log("[v0] Canvas created, attempting to decode...")
            console.log("[v0] Available methods on codeReader:", Object.getOwnPropertyNames(codeReaderRef.current))
            
            // Use the original ZXing method that works
            let result = null
            try {
              // Convert canvas to data URL and use decodeFromImageUrl
              const dataURL = canvas.toDataURL('image/png')
              result = await codeReaderRef.current.decodeFromImageUrl(dataURL)
              console.log("[v0] decodeFromImageUrl result:", result)
            } catch (err) {
              console.log("[v0] decodeFromImageUrl failed:", err.message)
              // Fallback: try decodeFromCanvas
              try {
                result = await codeReaderRef.current.decodeFromCanvas(canvas)
                console.log("[v0] decodeFromCanvas result:", result)
              } catch (err2) {
                console.log("[v0] decodeFromCanvas also failed:", err2.message)
              }
            }
            
                if (result && result.getText()) {
                  const scannedCode = result.getText()
                  console.log("[v0] Barcode detected:", scannedCode)
                  
                  // Avoid duplicate scans
                  if (scannedCode !== lastScannedCode) {
                    setLastScannedCode(scannedCode)
                    console.log("[v0] Barcode scanned:", scannedCode)
                    setStatusMessage("Barcode found! Processing...")
                    setIsProcessing(true)
                    
                    // For testing: accept any barcode, not just ISBNs
                    console.log("[v0] Any barcode found:", scannedCode)
                    
                    // Add a small delay to show the processing state
                    setTimeout(() => {
                      onScanSuccess(scannedCode)
                      stopScanning()
                    }, 1000)
                  }
                } else {
                  console.log("[v0] No barcode found in this frame")
                }
          } else {
            console.log("[v0] Canvas context or video dimensions not available")
          }
          
          // Hide detecting indicator after a short delay
          setTimeout(() => setIsDetecting(false), 200)
        } else {
          console.log("[v0] Cannot scan - missing requirements:", {
            videoRef: !!videoRef.current,
            codeReader: !!codeReaderRef.current,
            videoPaused: videoRef.current?.paused
          })
        }
      } catch (err) {
        console.log("[v0] Scanning error:", err.message)
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
    setIsDetecting(false) // Ensure detecting state is reset
    setIsProcessing(false) // Reset processing state
    setStatusMessage("") // Clear status message
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

            {/* Processing indicator */}
            {isProcessing && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
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
            <div>Detecting: {isDetecting ? 'Yes' : 'No'}</div>
            <div>Code Reader: {codeReaderRef.current ? 'Ready' : 'Missing'}</div>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

          {/* Status Message */}
          {statusMessage && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm">
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                )}
                {statusMessage}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {!isScanning ? (
              <Button onClick={startScanning} className="flex-1" size="lg" disabled={isProcessing}>
                <Camera className="mr-2 h-4 w-4" />
                Start Camera
              </Button>
            ) : (
              <Button onClick={stopScanning} variant="destructive" className="flex-1" size="lg" disabled={isProcessing}>
                <CameraOff className="mr-2 h-4 w-4" />
                Stop Camera
              </Button>
            )}
          </div>

      {/* Test buttons */}
      {isScanning && (
        <div className="text-center space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setIsDetecting(true)
              setTimeout(() => setIsDetecting(false), 1000)
            }}
          >
            Test Visual Indicators
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                console.log("[v0] Manual test - simulating ISBN barcode")
                onScanSuccess("9780008710262")
              }}
            >
              Test ISBN
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                console.log("[v0] Manual test - simulating product barcode")
                onScanSuccess("1234567890123")
              }}
            >
              Test Product
            </Button>
          </div>
        </div>
      )}

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
