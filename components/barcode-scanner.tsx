"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode"
import { validateISBN } from "@/lib/isbn-validation"
import { Button } from "@/components/ui/button"
import { X, Camera, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface BarcodeScannerProps {
  onScanSuccess: (isbn: string) => void
  onError?: (error: string) => void
  onClose?: () => void
}

export function BarcodeScanner({ onScanSuccess, onError, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const isRunningRef = useRef<boolean>(false)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [permissionRequested, setPermissionRequested] = useState(false)
  const [showPermissionButton, setShowPermissionButton] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const viewfinderId = "barcode-scanner-viewfinder"

  const requestCameraPermission = async () => {
    try {
      // Request camera permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      // Stop the stream immediately - we just wanted permission
      stream.getTracks().forEach(track => track.stop())
      setPermissionRequested(true)
      setShowPermissionButton(false)
      setCameraError(null)
      // Now start the scanner
      await startScanning()
    } catch (err: any) {
      let errorMsg = "Camera permission denied"
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        errorMsg = "Camera permission denied. Please enable camera access in your browser settings."
      } else if (err?.name === "NotFoundError") {
        errorMsg = "No camera found. Please use manual entry instead."
      }
      setCameraError(errorMsg)
      setShowPermissionButton(true)
      onError?.(errorMsg)
    }
  }

  const handleStartScanning = async () => {
    setHasStarted(true)
    await startScanning()
  }

  const startScanning = async () => {
    let isMounted = true

    try {
      const scanner = new Html5Qrcode(viewfinderId)
      scannerRef.current = scanner

      // Try to get camera devices to determine best camera
      const devices = await Html5Qrcode.getCameras()
      const backCamera = devices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      )
      const cameraId = backCamera?.id || devices[0]?.id || "environment"

        await scanner.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.CODE_128
            ],
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Validate as ISBN
            if (validateISBN(decodedText)) {
              if (isMounted && isRunningRef.current) {
                isRunningRef.current = false
                const stopScanner = async () => {
                  try {
                    if (scannerRef.current) {
                      await scannerRef.current.stop()
                      scannerRef.current.clear()
                    }
                  } catch (err: any) {
                    // Ignore stop errors - scanner might already be stopped
                    if (!err?.message?.includes("not running") && !err?.message?.includes("not started")) {
                      console.debug("Scanner stop error:", err)
                    }
                  }
                  if (isMounted) {
                    onScanSuccess(decodedText)
                  }
                }
                stopScanner()
              }
            } else {
              // Not a valid ISBN, but might be a barcode - try to extract ISBN
              // Some barcodes might have extra digits, try cleaning
              const cleaned = decodedText.replace(/[^\d]/g, '')
              if (cleaned.length === 13 && validateISBN(cleaned)) {
                if (isMounted && isRunningRef.current) {
                  isRunningRef.current = false
                  const stopScanner = async () => {
                    try {
                      if (scannerRef.current) {
                        await scannerRef.current.stop()
                        scannerRef.current.clear()
                      }
                    } catch (err: any) {
                      // Ignore stop errors - scanner might already be stopped
                      if (!err?.message?.includes("not running") && !err?.message?.includes("not started")) {
                        console.debug("Scanner stop error:", err)
                      }
                    }
                    if (isMounted) {
                      onScanSuccess(cleaned)
                    }
                  }
                  stopScanner()
                }
              } else if (isMounted) {
                setError("Invalid ISBN format. Please try again or enter manually.")
                setTimeout(() => setError(null), 3000)
              }
            }
          },
          (errorMessage) => {
            // Ignore scanning errors (normal during scanning)
            // Only show errors if they're not just "not found" errors
            if (errorMessage && !errorMessage.includes("NotFoundException") && isMounted) {
              // Don't show every scanning error, just log it
              console.debug("Scanning:", errorMessage)
            }
          }
        )
        
        if (isMounted) {
          isRunningRef.current = true
          setScanning(true)
          setCameraError(null)
        }
      } catch (err: any) {
        if (!isMounted) return
        
        let errorMsg = "Failed to start camera"
        let needsPermission = false
        
        // Check for permission errors
        const errorMessage = err?.message || ""
        const errorName = err?.name || ""
        
        // More aggressive permission detection - most camera failures are permission-related
        if (
          errorMessage.includes("Permission denied") || 
          errorMessage.includes("NotAllowedError") || 
          errorMessage.includes("permission") ||
          errorMessage.includes("Failed to start") ||
          errorMessage.toLowerCase().includes("camera") ||
          errorMessage.toLowerCase().includes("getusermedia") ||
          errorName === "NotAllowedError" ||
          errorName === "PermissionDeniedError" ||
          errorName === "NotReadableError" ||
          errorName === "OverconstrainedError"
        ) {
          errorMsg = "Camera permission required to scan barcodes"
          needsPermission = true
        } else if (errorMessage.includes("NotFoundError") || errorMessage.includes("no camera") || errorName === "NotFoundError") {
          errorMsg = "No camera found. Please use manual entry instead."
        } else {
          // For any other error, assume it might be permission-related and show button
          errorMsg = errorMessage || "Failed to start camera"
          needsPermission = true // Show permission button for any camera error
        }
        
        setCameraError(errorMsg)
        setScanning(false)
        if (needsPermission) {
          setShowPermissionButton(true)
        }
        onError?.(errorMsg)
      }
    }

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (scannerRef.current && isRunningRef.current) {
        isRunningRef.current = false
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear()
        }).catch((err: any) => {
          // Ignore cleanup errors - scanner might already be stopped
          if (!err?.message?.includes("not running") && !err?.message?.includes("not started")) {
            console.debug("Scanner cleanup error:", err)
          }
        })
      }
    }
  }, [])

  const handleClose = () => {
    if (scannerRef.current && isRunningRef.current) {
      isRunningRef.current = false
      scannerRef.current.stop().then(() => {
        scannerRef.current?.clear()
      }).catch((err: any) => {
        // Ignore stop errors - scanner might already be stopped
        if (!err?.message?.includes("not running") && !err?.message?.includes("not started")) {
          console.debug("Scanner close error:", err)
        }
      })
    }
    onClose?.()
  }

  return (
    <div className="relative w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Scan Barcode</span>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close scanner</span>
          </Button>
        )}
      </div>

      {/* Camera Error - Only show if permission button is not showing */}
      {cameraError && !showPermissionButton && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{cameraError}</AlertDescription>
        </Alert>
      )}

      {/* Scanning Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Start Scanner Button - Show if not started */}
      {!hasStarted && !scanning && (
        <div className="space-y-4">
          <div className="text-center py-8 border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Click the button below to start the camera scanner
            </p>
            <Button 
              onClick={handleStartScanning}
              className="w-full sm:w-auto"
            >
              <Camera className="h-4 w-4 mr-2" />
              Start Camera Scanner
            </Button>
          </div>
        </div>
      )}

      {/* Viewfinder */}
      {hasStarted && (
        <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden">
          <div
            id={viewfinderId}
            className="w-full h-full"
          />
          {scanning && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-white/50 rounded-lg w-[250px] h-[250px] flex items-center justify-center">
                <div className="text-white/70 text-sm text-center px-4">
                  Point camera at barcode
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {scanning && !cameraError && (
        <div className="text-center text-sm text-muted-foreground">
          <p>Position the barcode within the frame</p>
          <p className="text-xs mt-1">The scan will start automatically</p>
        </div>
      )}

      {/* Permission Request Button */}
      {showPermissionButton && (
        <div className="space-y-2">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Camera access is required to scan barcodes. Click the button below to request permission.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={requestCameraPermission}
            className="w-full"
          >
            <Camera className="h-4 w-4 mr-2" />
            Request Camera Permission
          </Button>
        </div>
      )}

      {/* Fallback */}
      {cameraError && !showPermissionButton && onClose && (
        <div className="text-center">
          <Button onClick={onClose} variant="outline">
            Use Manual Entry Instead
          </Button>
        </div>
      )}
    </div>
  )
}

