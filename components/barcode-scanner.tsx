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
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const scanningIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const startScanning = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsScanning(true)
        setHasPermission(true)

        // Initialize barcode reader
        const codeReader = new BrowserMultiFormatReader()
        codeReaderRef.current = codeReader

        // Start scanning for barcodes
        startBarcodeScanning()
      }
    } catch (err) {
      console.error("[v0] Camera access error:", err)
      setError("Unable to access camera. Please check permissions and try again.")
      setHasPermission(false)
    }
  }

  const startBarcodeScanning = () => {
    if (!videoRef.current || !codeReaderRef.current) return

    const scanBarcode = async () => {
      try {
        if (videoRef.current && codeReaderRef.current) {
          const result = await codeReaderRef.current.decodeFromVideoElement(videoRef.current)
          if (result && result.getText()) {
            const scannedCode = result.getText()
            
            // Avoid duplicate scans
            if (scannedCode !== lastScannedCode) {
              setLastScannedCode(scannedCode)
              console.log("[v0] Barcode scanned:", scannedCode)
              
              // Check if it looks like an ISBN
              if (isValidISBN(scannedCode)) {
                onScanSuccess(scannedCode)
                stopScanning()
              }
            }
          }
        }
      } catch (err) {
        // Ignore scanning errors - they're expected when no barcode is found
      }
    }

    // Scan every 500ms
    scanningIntervalRef.current = setInterval(scanBarcode, 500)
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
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
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
            <div className="w-64 h-40 border-2 border-primary rounded-lg shadow-lg">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
            </div>
          </div>
        )}

        {lastScannedCode && (
          <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-2 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">ISBN Found!</span>
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
    </div>
  )
}
