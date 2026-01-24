"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, Sun, Moon, Monitor, Palette, Check, LayoutTemplate } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUserPreferences } from "@/hooks/use-user-preferences"
import { AESTHETIC_THEMES, type AestheticThemeId } from "@/lib/config/aesthetic-themes"
import { cn } from "@/lib/utils"
import { ShareSubtextButton } from "@/components/share-subtext-button"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { preferences, updatePreference } = useUserPreferences()
  const savedAesthetic = (preferences.aestheticTheme || "reader") as AestheticThemeId
  const [pendingAesthetic, setPendingAesthetic] = useState<AestheticThemeId>(savedAesthetic)
  const isDirty = pendingAesthetic !== savedAesthetic

  // Sync pending from saved when it changes (e.g. after Apply, or when prefs load on client)
  useEffect(() => {
    setPendingAesthetic(savedAesthetic)
  }, [savedAesthetic])

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Link href="/">
          <Button variant="ghost" className="mb-6 text-muted-foreground hover:text-foreground -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>

        <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground mb-2">
          Settings
        </h1>
        <p className="text-muted-foreground text-sm mb-10">
          Appearance and preferences.
        </p>

        {/* Appearance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="h-4 w-4" />
              Appearance
            </CardTitle>
            <CardDescription>
              Mode and BookTok-style aesthetic.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Mode: Light / Dark / System */}
            <div className="space-y-3">
              <span className="text-sm font-medium text-foreground">Mode</span>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                  className="flex-1"
                >
                  <Sun className="h-4 w-4 mr-1.5" />
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                  className="flex-1"
                >
                  <Moon className="h-4 w-4 mr-1.5" />
                  Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("system")}
                  className="flex-1"
                >
                  <Monitor className="h-4 w-4 mr-1.5" />
                  System
                </Button>
              </div>
            </div>

            {/* Aesthetic */}
            <div className="space-y-3">
              <span className="text-sm font-medium text-foreground">Aesthetic</span>
              <div className="grid gap-2 sm:grid-cols-2">
                {AESTHETIC_THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPendingAesthetic(t.id)}
                    className={cn(
                      "text-left p-3 rounded-lg border transition-colors",
                      pendingAesthetic === t.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium text-sm text-foreground">{t.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {t.description}
                        </div>
                      </div>
                      {pendingAesthetic === t.id && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {isDirty && (
                <Button
                  onClick={() => {
                    updatePreference("aestheticTheme", pendingAesthetic)
                    toast.success("Theme applied")
                  }}
                  size="sm"
                  className="mt-2"
                >
                  Apply theme
                </Button>
              )}
            </div>

            {/* Book page layouts (design) — dev only */}
            {process.env.NODE_ENV === "development" && (
              <div className="space-y-3 border-t border-border pt-6">
                <span className="text-sm font-medium text-foreground">Book page layouts</span>
                <p className="text-xs text-muted-foreground">
                  Compare Baseline, Compact, and Spacious layouts with fixture data.
                </p>
                <div className="flex gap-2">
                  {(["baseline", "compact", "spacious"] as const).map((v) => (
                    <Button
                      key={v}
                      variant={(preferences.bookPageLayoutPreview ?? "baseline") === v ? "default" : "outline"}
                      size="sm"
                      onClick={() => updatePreference("bookPageLayoutPreview", v)}
                      className="flex-1"
                    >
                      {v === "baseline" ? "Baseline" : v === "compact" ? "Compact" : "Spacious"}
                    </Button>
                  ))}
                </div>
                <Link
                  href={`/design/book-page?v=${preferences.bookPageLayoutPreview ?? "baseline"}`}
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <LayoutTemplate className="h-4 w-4" />
                  Preview
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Share Subtext */}
        <ShareSubtextButton />
      </div>
    </main>
  )
}
