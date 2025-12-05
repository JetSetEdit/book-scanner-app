import { BookOpen, Shield, Users, ScanBarcode, Search, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-24 md:py-32 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Subtext Logo" className="h-24 w-24 md:h-32 md:w-32 object-contain" />
          </div>

          <div className="inline-flex items-center rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 bg-slate-50">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2"></span>
            v1.0 Now Available
          </div>

          <h1 className="font-serif text-6xl md:text-8xl font-bold tracking-tight text-slate-900 leading-[1.1]">
            The hidden context <br className="hidden md:block" />
            <span className="text-slate-500 italic">of every story.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-xl text-slate-600 leading-relaxed font-light">
            Subtext analyzes books to reveal content warnings, age ratings, and thematic depth—so you can read with confidence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/scan-test">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200/50 transition-all hover:scale-105">
                <ScanBarcode className="mr-2 h-5 w-5" />
                Start Scanning
              </Button>
            </Link>
            <Link href="/collection">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300">
                <Search className="mr-2 h-5 w-5" />
                Browse Library
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="border-t border-slate-100 bg-slate-50/50">
        <div className="container mx-auto px-4 py-24">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-full bg-amber-100/50 flex items-center justify-center text-amber-700">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-slate-900">Content Warnings</h3>
              <p className="text-slate-600 leading-relaxed">
                Detailed, AI-generated alerts for sensitive topics. We verify against author notes and community feedback for maximum accuracy.
              </p>
            </div>

            <div className="space-y-4">
              <div className="h-12 w-12 rounded-full bg-blue-100/50 flex items-center justify-center text-blue-700">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-slate-900">Deep Analysis</h3>
              <p className="text-slate-600 leading-relaxed">
                Beyond just warnings. Understand the themes, tone, and emotional weight of a book before you commit to reading it.
              </p>
            </div>

            <div className="space-y-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100/50 flex items-center justify-center text-emerald-700">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-slate-900">Community Verified</h3>
              <p className="text-slate-600 leading-relaxed">
                Real readers contribute to our database, ensuring that our AI's analysis is grounded in actual reading experiences.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
