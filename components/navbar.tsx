"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { BookOpen, Library, Menu, X, Settings, Code, FileText, RefreshCw, Calculator, Trash2, Brain } from "lucide-react"
import { cn } from "@/lib/utils"
import { SearchComponent } from "@/components/search"
import { SparksCounter } from "@/components/sparks-counter"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

const navigation = [
  {
    name: "Home",
    href: "/",
    icon: BookOpen,
  },
  {
    name: "Bookshelf",
    href: "/collection",
    icon: Library,
  },
  {
    name: "Help Improve",
    href: "/rlhf",
    icon: Brain,
  },
]

// Check if we're in dev mode
function isDevMode(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    process.env.NODE_ENV === 'development'
  )
}

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDev, setIsDev] = useState(false)
  const [showAuditTrail, setShowAuditTrail] = useState(false)
  const [showRefreshButton, setShowRefreshButton] = useState(false)
  const [showSeverityScore, setShowSeverityScore] = useState(false)
  const [showAdminControls, setShowAdminControls] = useState(false)

  useEffect(() => {
    setIsDev(isDevMode())
    // Load dev settings from localStorage
    if (isDevMode()) {
      const savedAudit = localStorage.getItem('dev-show-audit-trail')
      setShowAuditTrail(savedAudit === 'true')
      const savedRefresh = localStorage.getItem('dev-show-refresh-button')
      setShowRefreshButton(savedRefresh === 'true')
      const savedSeverityScore = localStorage.getItem('dev-show-severity-score')
      setShowSeverityScore(savedSeverityScore === 'true')
      const savedAdminControls = localStorage.getItem('dev-show-admin-controls')
      setShowAdminControls(savedAdminControls === 'true')
    }
  }, [])

  const toggleAuditTrail = () => {
    const newValue = !showAuditTrail
    setShowAuditTrail(newValue)
    localStorage.setItem('dev-show-audit-trail', String(newValue))
    // Update all book detail pages by triggering a custom event
    window.dispatchEvent(new CustomEvent('dev-settings-changed', { 
      detail: { showAuditTrail: newValue, showRefreshButton, showSeverityScore, showAdminControls } 
    }))
  }

  const toggleRefreshButton = () => {
    const newValue = !showRefreshButton
    setShowRefreshButton(newValue)
    localStorage.setItem('dev-show-refresh-button', String(newValue))
    // Update all pages by triggering a custom event
    window.dispatchEvent(new CustomEvent('dev-settings-changed', { 
      detail: { showAuditTrail, showRefreshButton: newValue, showSeverityScore, showAdminControls } 
    }))
  }

  const toggleSeverityScore = () => {
    const newValue = !showSeverityScore
    setShowSeverityScore(newValue)
    localStorage.setItem('dev-show-severity-score', String(newValue))
    // Update all pages by triggering a custom event
    window.dispatchEvent(new CustomEvent('dev-settings-changed', { 
      detail: { showAuditTrail, showRefreshButton, showSeverityScore: newValue, showAdminControls } 
    }))
  }

  const toggleAdminControls = () => {
    const newValue = !showAdminControls
    setShowAdminControls(newValue)
    localStorage.setItem('dev-show-admin-controls', String(newValue))
    // Update all pages by triggering a custom event
    window.dispatchEvent(new CustomEvent('dev-settings-changed', { 
      detail: { showAuditTrail, showRefreshButton, showSeverityScore, showAdminControls: newValue } 
    }))
  }

  return (
    <nav className="relative z-40 border-b border-amber-100 bg-amber-50/95 backdrop-blur supports-[backdrop-filter]:bg-amber-50/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Subtext Logo" className="h-10 w-10 object-contain" />
            <span className="text-2xl font-serif font-bold tracking-tight text-slate-900">Subtext</span>
          </Link>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <SearchComponent />
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
            
            {/* Sparks Counter */}
            <SparksCounter />
            
            {/* Dev Settings Dropdown */}
            {isDev && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    <Code className="h-4 w-4" />
                    <span className="hidden lg:inline">Dev</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Developer Settings
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={toggleAuditTrail}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="h-4 w-4" />
                    <div className="flex-1">
                      <div className="font-medium">Show Audit Trail</div>
                      <div className="text-xs text-muted-foreground">
                        Display system logs on book pages
                      </div>
                    </div>
                    <div className={cn(
                      "h-4 w-4 rounded border-2 transition-colors",
                      showAuditTrail 
                        ? "bg-primary border-primary" 
                        : "border-muted-foreground"
                    )}>
                      {showAuditTrail && (
                        <div className="h-full w-full bg-primary rounded-sm" />
                      )}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={toggleRefreshButton}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <div className="flex-1">
                      <div className="font-medium">Show Refresh Button</div>
                      <div className="text-xs text-muted-foreground">
                        Display refresh button on book cards
                      </div>
                    </div>
                    <div className={cn(
                      "h-4 w-4 rounded border-2 transition-colors",
                      showRefreshButton 
                        ? "bg-primary border-primary" 
                        : "border-muted-foreground"
                    )}>
                      {showRefreshButton && (
                        <div className="h-full w-full bg-primary rounded-sm" />
                      )}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={toggleSeverityScore}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Calculator className="h-4 w-4" />
                    <div className="flex-1">
                      <div className="font-medium">Show Severity Score</div>
                      <div className="text-xs text-muted-foreground">
                        Display severity score badges on book cards
                      </div>
                    </div>
                    <div className={cn(
                      "h-4 w-4 rounded border-2 transition-colors",
                      showSeverityScore 
                        ? "bg-primary border-primary" 
                        : "border-muted-foreground"
                    )}>
                      {showSeverityScore && (
                        <div className="h-full w-full bg-primary rounded-sm" />
                      )}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={toggleAdminControls}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    <div className="flex-1">
                      <div className="font-medium">Show Admin Controls</div>
                      <div className="text-xs text-muted-foreground">
                        Enable delete/edit buttons on book pages
                      </div>
                    </div>
                    <div className={cn(
                      "h-4 w-4 rounded border-2 transition-colors",
                      showAdminControls 
                        ? "bg-primary border-primary" 
                        : "border-muted-foreground"
                    )}>
                      {showAdminControls && (
                        <div className="h-full w-full bg-primary rounded-sm" />
                      )}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dev/agent-comparison" className="flex items-center gap-2 cursor-pointer">
                      <Code className="h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">Agent Comparison Tool</div>
                        <div className="text-xs text-muted-foreground">
                          Compare old vs new agent instructions
                        </div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              {/* Mobile Search */}
              <div className="px-3 py-2 mb-2">
                <SearchComponent />
              </div>
              
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
              
              {/* Dev Settings in Mobile Menu */}
              {isDev && (
                <div className="px-3 py-2 border-t mt-2 pt-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Code className="h-3 w-3" />
                    Dev Settings
                  </div>
                  <button
                    onClick={() => {
                      toggleAuditTrail()
                      setMobileMenuOpen(false)
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      showAuditTrail
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Show Audit Trail</span>
                    </div>
                    <div className={cn(
                      "h-4 w-4 rounded border-2 transition-colors",
                      showAuditTrail 
                        ? "bg-primary-foreground border-primary-foreground" 
                        : "border-muted-foreground"
                    )}>
                      {showAuditTrail && (
                        <div className="h-full w-full bg-primary-foreground rounded-sm" />
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      toggleRefreshButton()
                      setMobileMenuOpen(false)
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors mt-1",
                      showRefreshButton
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      <span>Show Refresh Button</span>
                    </div>
                    <div className={cn(
                      "h-4 w-4 rounded border-2 transition-colors",
                      showRefreshButton 
                        ? "bg-primary-foreground border-primary-foreground" 
                        : "border-muted-foreground"
                    )}>
                      {showRefreshButton && (
                        <div className="h-full w-full bg-primary-foreground rounded-sm" />
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      toggleSeverityScore()
                      setMobileMenuOpen(false)
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors mt-1",
                      showSeverityScore
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      <span>Show Severity Score</span>
                    </div>
                    <div className={cn(
                      "h-4 w-4 rounded border-2 transition-colors",
                      showSeverityScore 
                        ? "bg-primary-foreground border-primary-foreground" 
                        : "border-muted-foreground"
                    )}>
                      {showSeverityScore && (
                        <div className="h-full w-full bg-primary-foreground rounded-sm" />
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      toggleAdminControls()
                      setMobileMenuOpen(false)
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors mt-1",
                      showAdminControls
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      <span>Show Admin Controls</span>
                    </div>
                    <div className={cn(
                      "h-4 w-4 rounded border-2 transition-colors",
                      showAdminControls 
                        ? "bg-primary-foreground border-primary-foreground" 
                        : "border-muted-foreground"
                    )}>
                      {showAdminControls && (
                        <div className="h-full w-full bg-primary-foreground rounded-sm" />
                      )}
                    </div>
                  </button>
                  <Link
                    href="/dev/agent-comparison"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors mt-1",
                      "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <Code className="h-4 w-4" />
                    <span>Agent Comparison Tool</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
