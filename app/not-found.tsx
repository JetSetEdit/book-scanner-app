import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RecentScans } from "@/components/recent-scans"
import { ScanBarcode, Home, Library } from "lucide-react"

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="border border-border bg-card/60 p-10">
            <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3">404</p>
            <h1 className="font-serif text-3xl font-bold text-foreground mb-3">Page not found</h1>
            <p className="text-muted-foreground leading-relaxed mb-8">
              That page doesn&apos;t exist. If you were trying to scan a book, head to the scanner and we&apos;ll help you
              find it by ISBN.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/">
                <Button variant="outline" className="w-full sm:w-auto gap-2">
                  <Home className="h-4 w-4" />
                  Back to home
                </Button>
              </Link>
              <Link href="/scan">
                <Button className="w-full sm:w-auto gap-2">
                  <ScanBarcode className="h-4 w-4" />
                  Scan a book
                </Button>
              </Link>
              <Link href="/collection">
                <Button variant="ghost" className="w-full sm:w-auto gap-2">
                  <Library className="h-4 w-4" />
                  Browse collection
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested next action: recent scans (if available) */}
      <RecentScans />
    </main>
  )
}


