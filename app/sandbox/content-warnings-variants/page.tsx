"use client"

import { ChevronDown } from "lucide-react"
import Link from "next/link"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Ban, Flame, Sword } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Tester page: which Detailed content warnings row style do you mean?
 * Visit /sandbox/content-warnings-variants — pick A–H or describe it.
 */

const MOCK_ROWS = [
  { category: "Discrimination", severity: "severe" as const, severityColor: "border-l-red-500" },
  { category: "Sexual Content", severity: "moderate" as const, severityColor: "border-l-orange-500" },
  { category: "Violence", severity: "mild" as const, severityColor: "border-l-amber-500" },
]

function IconForCategory(cat: string) {
  if (cat === "Discrimination") return <Ban className="h-4 w-4 text-muted-foreground shrink-0" />
  if (cat === "Sexual Content") return <Flame className="h-4 w-4 text-muted-foreground shrink-0" />
  return <Sword className="h-4 w-4 text-muted-foreground shrink-0" />
}

export default function ContentWarningsVariantsPage() {
  return (
    <main className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-10">
        <p className="text-sm text-muted-foreground">
          <Link href="/sandbox" className="underline">← Sandbox</Link>
        </p>
        <h1 className="text-2xl font-serif font-medium">
          Which row style do you mean?
        </h1>
        <p className="text-muted-foreground text-sm">
          Same three warnings, different row styles. Pick a letter or describe what you mean.
        </p>

        {/* A: Default grouped layout — icon + label + count badge + chevron (no colored bar) */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">A — Grouped row (icon + label + count + chevron)</h2>
          <p className="text-xs text-muted-foreground">No colored bar. Like the live book page category toggles.</p>
          <div className="space-y-1">
            {MOCK_ROWS.map((row) => (
              <Collapsible key={row.category}>
                <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-muted/5 hover:bg-muted/40 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    {IconForCategory(row.category)}
                    <span className="font-medium text-sm">{row.category}</span>
                    <Badge variant="secondary" className="text-xs">1</Badge>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-3 border-t border-border text-sm text-muted-foreground">
                    Example description for {row.category}.
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </section>

        {/* B: Disclosure with "Content warning: Category — Severity" + icon (no colored bar) */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">B — Content warning: Category — Severity (with icon)</h2>
          <p className="text-xs text-muted-foreground">Icon + full line of text + chevron. No colored left bar.</p>
          <div className="space-y-1">
            {MOCK_ROWS.map((row) => (
              <Collapsible key={row.category}>
                <CollapsibleTrigger className="w-full flex items-center gap-3 rounded-lg border border-border px-4 py-3.5 bg-muted/30 hover:bg-muted/50 text-left">
                  {IconForCategory(row.category)}
                  <span className="flex-1 text-sm font-medium">
                    <span className="text-muted-foreground">Content warning:</span> {row.category} — {row.severity === "severe" ? "Severe" : row.severity === "moderate" ? "Moderate" : "Mild"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-3 border-t border-border text-sm text-muted-foreground rounded-b-lg border-x border-b border-border">
                    Example description for {row.category}.
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </section>

        {/* C: Colored bar (|) + horizontal line + category + chevron */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">C — Colored bar (|) + line + category + chevron</h2>
          <p className="text-xs text-muted-foreground">Left edge colored by severity, then dash line, then category name only.</p>
          <div className="space-y-3">
            {MOCK_ROWS.map((row) => (
              <Collapsible key={row.category}>
                <CollapsibleTrigger
                  className={cn(
                    "w-full flex items-center gap-3 rounded-t-lg border border-border border-l-4 pl-0 pr-4 py-3.5 text-left",
                    row.severityColor,
                    "bg-muted/30 hover:bg-muted/50 cursor-pointer"
                  )}
                >
                  <div className="h-px w-10 shrink-0 bg-border self-center" aria-hidden />
                  <span className="flex-1 text-sm font-medium">{row.category}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className={cn("rounded-b-lg border-x border-b border-border border-l-4 px-4 py-3 text-sm text-muted-foreground", row.severityColor, "bg-muted/20")}>
                    Example description for {row.category}.
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </section>

        {/* D: Colored bar only, no horizontal line — bar then category + chevron */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">D — Colored bar only (no line) + category + chevron</h2>
          <p className="text-xs text-muted-foreground">Left border colored; content starts right after (no dash/line).</p>
          <div className="space-y-2">
            {MOCK_ROWS.map((row) => (
              <Collapsible key={row.category}>
                <CollapsibleTrigger
                  className={cn(
                    "w-full flex items-center gap-3 rounded-t-lg border border-border border-l-4 px-4 py-3.5 text-left",
                    row.severityColor,
                    "bg-muted/30 hover:bg-muted/50 cursor-pointer"
                  )}
                >
                  <span className="flex-1 text-sm font-medium">{row.category}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className={cn("rounded-b-lg border-x border-b border-border border-l-4 px-4 py-3 text-sm text-muted-foreground", row.severityColor, "bg-muted/20")}>
                    Example description for {row.category}.
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </section>

        {/* E: Colored bar + icon + category + chevron */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">E — Colored bar + icon + category + chevron</h2>
          <p className="text-xs text-muted-foreground">Severity bar on left, then icon, then label. No line, no &quot;Content warning:&quot;.</p>
          <div className="space-y-2">
            {MOCK_ROWS.map((row) => (
              <Collapsible key={row.category}>
                <CollapsibleTrigger
                  className={cn(
                    "w-full flex items-center gap-3 rounded-t-lg border border-border border-l-4 px-4 py-3.5 text-left",
                    row.severityColor,
                    "bg-muted/30 hover:bg-muted/50 cursor-pointer"
                  )}
                >
                  {IconForCategory(row.category)}
                  <span className="flex-1 text-sm font-medium">{row.category}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className={cn("rounded-b-lg border-x border-b border-border border-l-4 px-4 py-3 text-sm text-muted-foreground", row.severityColor, "bg-muted/20")}>
                    Example description for {row.category}.
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </section>

        {/* F: Colored bar + category + severity pill + chevron */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">F — Colored bar + category + severity pill + chevron</h2>
          <p className="text-xs text-muted-foreground">Bar, then category name, then a small pill (e.g. Severe), then chevron.</p>
          <div className="space-y-2">
            {MOCK_ROWS.map((row) => (
              <Collapsible key={row.category}>
                <CollapsibleTrigger
                  className={cn(
                    "w-full flex items-center gap-3 rounded-t-lg border border-border border-l-4 px-4 py-3.5 text-left",
                    row.severityColor,
                    "bg-muted/30 hover:bg-muted/50 cursor-pointer"
                  )}
                >
                  <span className="flex-1 text-sm font-medium">{row.category}</span>
                  <Badge variant="secondary" className="text-xs capitalize">{row.severity}</Badge>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className={cn("rounded-b-lg border-x border-b border-border border-l-4 px-4 py-3 text-sm text-muted-foreground", row.severityColor, "bg-muted/20")}>
                    Example description for {row.category}.
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </section>

        {/* G: Literal "| ———— Category" text (pipe + dashes + label) */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">G — Literal pipe + dashes in text: &quot;| ———— Category&quot;</h2>
          <p className="text-xs text-muted-foreground">The bar and line are typed characters in the label, not CSS.</p>
          <div className="space-y-2">
            {MOCK_ROWS.map((row) => (
              <Collapsible key={row.category}>
                <CollapsibleTrigger className="w-full flex items-center gap-2 rounded-lg border border-border px-4 py-3.5 bg-muted/30 hover:bg-muted/50 text-left font-mono text-sm">
                  <span className={cn(
                    "font-bold",
                    row.severity === "severe" && "text-red-600",
                    row.severity === "moderate" && "text-orange-600",
                    row.severity === "mild" && "text-amber-600"
                  )}>|</span>
                  <span className="text-muted-foreground"> ———— </span>
                  <span className="font-medium text-foreground">{row.category}</span>
                  <span className="flex-1" />
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-3 border-t border-border text-sm text-muted-foreground rounded-b-lg border-x border-b border-border">
                    Example description for {row.category}.
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </section>

        {/* H: Thicker colored bar (w-2) + category + chevron */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">H — Thicker colored bar (block) + category + chevron</h2>
          <p className="text-xs text-muted-foreground">Wide colored block on the left (not just a border), then category.</p>
          <div className="space-y-2">
            {MOCK_ROWS.map((row) => (
              <Collapsible key={row.category}>
                <CollapsibleTrigger className="w-full flex items-center gap-3 rounded-t-lg border border-border overflow-hidden bg-muted/30 hover:bg-muted/50 cursor-pointer text-left">
                  <div className={cn("w-2 self-stretch shrink-0", row.severity === "severe" && "bg-red-500", row.severity === "moderate" && "bg-orange-500", row.severity === "mild" && "bg-amber-500")} />
                  <span className="flex-1 py-3.5 text-sm font-medium">{row.category}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mr-4 transition-transform duration-200 data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="flex rounded-b-lg border-x border-b border-border overflow-hidden">
                    <div className={cn("w-2 self-stretch shrink-0", row.severity === "severe" && "bg-red-500", row.severity === "moderate" && "bg-orange-500", row.severity === "mild" && "bg-amber-500")} />
                    <div className="px-4 py-3 text-sm text-muted-foreground bg-muted/20 flex-1">
                      Example description for {row.category}.
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </section>

        <p className="text-sm text-muted-foreground pt-4">
          Reply with a letter (A–H) or describe it (e.g. &quot;the bar was on the right&quot;, &quot;had a divider between rows&quot;).
        </p>
      </div>
    </main>
  )
}
