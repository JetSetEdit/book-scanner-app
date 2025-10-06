"use client"

import { BarcodeScanner } from "@/components/barcode-scanner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Camera, TestTube } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function ScannerPage() {
  const router = useRouter()
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null)

  const handleScanSuccess = (barcode: string) => {
    console.log("[SCANNER] Barcode scanned:", barcode)
    setLastScannedCode(barcode)
    
    // Check if it's a valid ISBN (10 or 13 digits)
    const cleanBarcode = barcode.replace(/[^\d]/g, '')
    const isISBN = cleanBarcode.length === 10 || cleanBarcode.length === 13
    
    if (isISBN) {
      // It's an ISBN, redirect to book page
      router.push(`/book/${barcode}`)
    } else {
      // It's not an ISBN, redirect to product page
      router.push(`/product/${barcode}`)
    }
  }

  const handleBack = () => {
    router.push('/')
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Barcode Scanner</h1>
              <p className="text-muted-foreground">Scan any barcode to identify products or books</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Scanner */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Camera Scanner
                </CardTitle>
                <CardDescription>
                  Use your device camera to scan barcodes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BarcodeScanner onScanSuccess={handleScanSuccess} />
              </CardContent>
            </Card>

            {/* Test Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Test Panel
                </CardTitle>
                <CardDescription>
                  Test barcode processing without camera
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Test ISBN (Book)</h4>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleScanSuccess("9780008710262")}
                  >
                    Test ISBN: 9780008710262
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    "When the Moon Hatched" - should go to book details
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Test Product Barcode</h4>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleScanSuccess("1234567890123")}
                  >
                    Test Product: 1234567890123
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Generic product - should go to product details
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Test Another ISBN</h4>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleScanSuccess("9780316769174")}
                  >
                    Test ISBN: 9780316769174
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    "The Catcher in the Rye" - should go to book details
                  </p>
                </div>

                {lastScannedCode && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800">Last Scanned:</h4>
                    <p className="text-sm text-green-700 font-mono">{lastScannedCode}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>How to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Camera Scanning:</h4>
                  <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                    <li>Click "Start Camera"</li>
                    <li>Point camera at any barcode</li>
                    <li>Wait for "Barcode Found!" indicator</li>
                    <li>Automatic redirect to product/book page</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Test Buttons:</h4>
                  <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                    <li>Use test buttons to verify routing</li>
                    <li>ISBNs go to book details with content warnings</li>
                    <li>Other barcodes go to product details</li>
                    <li>Check console logs for debugging info</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
