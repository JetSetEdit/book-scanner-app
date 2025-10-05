import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestBarcodesPage() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Barcodes for Scanner</h1>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Barcode 1</CardTitle>
              <CardDescription>ISBN: 9780008710262 (When the Moon Hatched)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-4 rounded border">
                <div className="text-center text-sm text-gray-600 mb-2">
                  Point your camera at this barcode:
                </div>
                <div className="flex justify-center">
                  <div className="bg-black h-20 w-48 flex items-center justify-center">
                    <div className="text-white text-xs">📱 Scan this area</div>
                  </div>
                </div>
                <div className="text-center text-xs text-gray-500 mt-2">
                  ISBN: 9780008710262
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Barcode 2</CardTitle>
              <CardDescription>Generic test barcode</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-4 rounded border">
                <div className="text-center text-sm text-gray-600 mb-2">
                  Point your camera at this barcode:
                </div>
                <div className="flex justify-center">
                  <div className="bg-black h-20 w-48 flex items-center justify-center">
                    <div className="text-white text-xs">📱 Scan this area</div>
                  </div>
                </div>
                <div className="text-center text-xs text-gray-500 mt-2">
                  Test Code: 1234567890123
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Real Barcode Image</CardTitle>
              <CardDescription>Use any product barcode</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-4 rounded border">
                <div className="text-center text-sm text-gray-600 mb-2">
                  Try scanning any product barcode:
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Food packaging</li>
                  <li>• Books</li>
                  <li>• Electronics</li>
                  <li>• Any product with a barcode</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Online Barcode Generator</CardTitle>
              <CardDescription>Generate test barcodes online</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <a 
                  href="https://www.barcode-generator.org/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-3 bg-blue-50 hover:bg-blue-100 rounded border text-blue-700 hover:text-blue-800 transition-colors"
                >
                  Barcode Generator - Create test barcodes
                </a>
                <a 
                  href="https://barcode.tec-it.com/en" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-3 bg-green-50 hover:bg-green-100 rounded border text-green-700 hover:text-green-800 transition-colors"
                >
                  TEC-IT Barcode Generator
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Testing Instructions:</h3>
          <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
            <li>Go to the main scanner page</li>
            <li>Click "Start Camera"</li>
            <li>Point camera at any barcode (real or generated)</li>
            <li>Wait for "ISBN Found!" indicator</li>
            <li>Check console logs for barcode detection</li>
          </ol>
        </div>
      </div>
    </main>
  )
}
