"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BookSpineLogo } from "@/components/book-spine-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setErrorMessage("")

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })

      const data = await res.json()

      if (data.ok) {
        // Cookie is set by the API response — redirect to the app
        router.push("/scan")
      } else {
        setStatus("error")
        setErrorMessage(data.error?.message || "Invalid invite code.")
      }
    } catch {
      setStatus("error")
      setErrorMessage("Something went wrong. Please try again.")
    }
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <BookSpineLogo className="h-20 w-20 text-foreground" />
          <span
            className="text-2xl font-serif font-normal tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Subtext
          </span>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h1 className="text-lg font-medium text-foreground">Enter your invite code</h1>
            <p className="text-sm text-muted-foreground">
              Paste the code from your invite email to access the beta.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="text"
              placeholder="e.g. SUBTEXT-ABCD-1234"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              disabled={status === "loading"}
              className="h-11 text-base text-center tracking-wider font-mono"
              autoFocus
              autoComplete="off"
            />
            <Button
              type="submit"
              size="lg"
              disabled={status === "loading" || !code.trim()}
              className="w-full h-11 font-semibold"
            >
              {status === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Log in"
              )}
            </Button>
          </form>

          {status === "error" && errorMessage && (
            <p className="text-sm text-destructive text-center animate-in fade-in duration-300">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Back link */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to homepage
          </Link>
        </div>
      </div>
    </main>
  )
}
