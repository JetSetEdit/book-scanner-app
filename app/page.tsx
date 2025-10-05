import { ScannerInterface } from "@/components/scanner-interface"
import { BookOpen, Shield, Users } from "lucide-react"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            <h1 className="text-xl font-bold">Book Content Scanner</h1>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-3 text-balance">Know Before You Read</h2>
            <p className="text-muted-foreground text-lg text-pretty">
              Scan any book to see content warnings, spice ratings, and age-appropriate classifications before you start
              reading
            </p>
          </div>

          <ScannerInterface />

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold">Content Warnings</h3>
              <p className="text-sm text-muted-foreground">Community-submitted warnings for sensitive content</p>
            </div>
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold">Spice Ratings</h3>
              <p className="text-sm text-muted-foreground">Clear ratings from mild to extremely hot</p>
            </div>
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold">Community Driven</h3>
              <p className="text-sm text-muted-foreground">Help others by contributing your own ratings</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
