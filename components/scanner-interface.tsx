"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { lookupBook } from "@/app/actions/book-actions"
import { BookOpen, Keyboard, ScanLine, AlertCircle } from "lucide-react"

export function ScannerInterface() {
  const [isbn, setIsbn] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSearch = async (searchIsbn: string) => {
    if (!searchIsbn.trim()) {
      setError("Please enter a valid ISBN")
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const result = await lookupBook(searchIsbn)

      if (result?.error) {
        setError(result.error)
      } else if (result?.success && result?.isbn) {
        router.push(`/book/${result.isbn}`)
      }
    } catch (err) {
      console.error("[v0] Search error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleSearch(isbn)
  }

  const handleScanSuccess = async (scannedIsbn: string) => {
    setIsbn(scannedIsbn)
    await handleSearch(scannedIsbn)
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Find a Book
        </CardTitle>
        <CardDescription>Scan a barcode or enter an ISBN manually</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="scan" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <ScanLine className="h-4 w-4" />
              Scan Barcode
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              Enter ISBN
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-4">
            <BarcodeScanner onScanSuccess={handleScanSuccess} />
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN Number</Label>
                <Input
                  id="isbn"
                  type="text"
                  placeholder="Enter ISBN (e.g., 9780316769174)"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  className="text-lg"
                  disabled={isSearching}
                />
                <p className="text-sm text-muted-foreground">
                  Enter the 10 or 13 digit ISBN found on the back of the book
                </p>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={!isbn.trim() || isSearching}>
                {isSearching ? "Searching..." : "Search Book"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
