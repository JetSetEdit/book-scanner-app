import { BookOpen, Shield, Users, ScanBarcode, Search, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b bg-gradient-to-b from-muted/50 to-background pb-16 pt-24 md:pb-32 md:pt-32">
        <div className="absolute inset-0 -z-10 opacity-20 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="container mx-auto px-4 text-center">
          <div className="animate-slide-up">
            <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium text-muted-foreground bg-background/50 backdrop-blur-sm mb-6">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              v1.0 Now Available
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl md:text-7xl mb-6">
              Read Safe.<br className="hidden sm:block" /> 
              <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">Know Before You Dive In.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              The ultimate companion for mindful readers. Scan any book to instantly reveal AI-analyzed content warnings, age ratings, and community insights.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/scan-test">
                <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20 transition-all hover:scale-105">
                  <ScanBarcode className="mr-2 h-5 w-5" />
                  Try Scanner Demo
                </Button>
              </Link>
              <Link href="/collection">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-background/50 backdrop-blur-sm hover:bg-accent/50">
                  <Search className="mr-2 h-5 w-5" />
                  Browse Collection
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-none shadow-none bg-transparent hover:bg-accent/30 transition-colors duration-300">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Shield className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">Content Warnings</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Detailed, AI-generated alerts for sensitive topics like violence, mental health, and more, verified by our community.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-none shadow-none bg-transparent hover:bg-accent/30 transition-colors duration-300">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 text-blue-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">AI Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Our advanced AI reads reviews and summaries across the web to detect potential triggers that official descriptions miss.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-none shadow-none bg-transparent hover:bg-accent/30 transition-colors duration-300">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4 text-green-600">
                <Users className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl">Community Driven</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Real readers vote on warning accuracy and severity. Contribute your own insights to help others read safely.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-auto border-t bg-muted/30">
        <div className="container mx-auto px-4 py-16 text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to start your safe reading journey?</h3>
          <p className="text-muted-foreground mb-8">Join thousands of readers making informed choices.</p>
          <Link href="/scan-test">
            <Button size="lg" variant="default">Get Started Now</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
