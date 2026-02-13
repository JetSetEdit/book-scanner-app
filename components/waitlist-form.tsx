"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle2, Loader2 } from "lucide-react"

const ROLES = [
  { value: "parent", label: "Parent" },
  { value: "teacher", label: "Teacher" },
  { value: "librarian", label: "Librarian" },
  { value: "bookseller", label: "Bookseller" },
  { value: "other", label: "Other" },
]

export function WaitlistForm() {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setMessage("")

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: role || null }),
      })

      const data = await res.json()

      if (data.ok) {
        setStatus("success")
        setMessage(data.message)
        setEmail("")
        setRole(undefined)
      } else {
        setStatus("error")
        setMessage(data.error?.message || "Something went wrong. Please try again.")
      }
    } catch {
      setStatus("error")
      setMessage("Something went wrong. Please try again.")
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-4 animate-in fade-in duration-500">
        <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        <p className="text-base font-medium text-foreground text-center">{message}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-3">
      <Input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={status === "loading"}
        className="w-full h-11 text-base"
      />

      <div className="flex items-center w-full border border-dashed border-input rounded-md h-11 overflow-hidden">
        <span className="text-sm font-medium text-foreground whitespace-nowrap px-4 bg-muted/50 h-full flex items-center border-r border-input">I am a</span>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-full h-9 text-sm text-muted-foreground border-0 shadow-none px-3 focus-visible:ring-0">
            <SelectValue placeholder="select one" />
          </SelectTrigger>
          <SelectContent side="bottom">
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={status === "loading" || !email.trim()}
        className="w-full h-11 font-semibold"
      >
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Join the beta"
        )}
      </Button>

      {status === "error" && message && (
        <p className="text-sm text-destructive text-center animate-in fade-in duration-300">
          {message}
        </p>
      )}
    </form>
  )
}
