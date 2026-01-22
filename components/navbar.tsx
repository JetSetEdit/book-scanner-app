"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { useTheme } from "next-themes"
import { BookOpen, Library, Menu, X, Settings, Code, FileText, RefreshCw, Calculator, Trash2, ScanBarcode, Moon, Sun, Image as ImageIcon, Info, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import { SearchComponent } from "@/components/search"
import { BookSpineLogo } from "@/components/book-spine-logo"
import { APP_VERSION, APP_VERSION_LABEL, APP_BUILD_DATE } from "@/lib/config/version"
import { CHANGELOG } from "@/lib/config/changelog"
import { getVariantId, getVariantConfig } from "@/lib/config/variants"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
  { name: "Home", href: "/", icon: BookOpen },
  { name: "Scan", href: "/scan", icon: ScanBarcode },
  { name: "Bookshelf", href: "/collection", icon: Library },
  { name: "Settings", href: "/settings", icon: Settings },
]

// Check if we're in dev mode (only localhost/127.0.0.1, not production)
function isDevMode(): boolean {
  if (typeof window === 'undefined') return false
  // Only show dev features on localhost - never in production
  const hostname = window.location.hostname.toLowerCase()
  
  // Explicitly hide in production domains
  if (hostname.includes('.vercel.app') || 
      hostname.includes('.netlify.app') ||
      hostname.includes('subtext.app') ||
      (hostname !== 'localhost' && 
       hostname !== '127.0.0.1' && 
       !hostname.startsWith('192.168.') && 
       !hostname.startsWith('10.') &&
       !hostname.includes('localhost'))) {
    return false
  }
  
  // Only show on localhost or local network
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.includes('localhost')
  )
}

export function Navbar({ userMode = 'regular' }: { userMode?: 'admin' | 'vip' | 'regular' }) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDev, setIsDev] = useState(false)
  
  // Dev settings state
  const [showAuditTrail, setShowAuditTrail] = useState(false)
  const [showRefreshButton, setShowRefreshButton] = useState(false)
  const [showSeverityScore, setShowSeverityScore] = useState(false)
  const [showAdminControls, setShowAdminControls] = useState(false)
  
  // ...

  useEffect(() => {
    setMounted(true)
    // Dev mode is active if Admin IP OR Localhost
    const isLocalhost = isDevMode()
    setIsDev(userMode === 'admin' || isLocalhost)
    
    // Load dev settings from localStorage
    if (userMode === 'admin' || isLocalhost) {
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

  // Navigation items (RLHF removed - backed up in backups/rlhf-backup-*)
  const visibleNavigation = useMemo(() => {
    return navigation
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
    <>
      <nav className="relative z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          {/* Top Row: Logo, Search, Desktop Nav */}
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <BookSpineLogo className="h-10 w-10 text-foreground" />
              <span className="text-2xl md:text-3xl font-serif font-normal tracking-tight text-foreground hidden sm:inline" style={{ fontFamily: 'var(--font-serif)' }}>{getVariantConfig().name}</span>
            </Link>

            {/* Search - Desktop */}
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <SearchComponent />
            </div>

            {/* Search - Mobile */}
            <div className="md:hidden flex-1 max-w-xs mx-2">
              <SearchComponent />
            </div>


            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center space-x-1">
              {visibleNavigation.map((item) => {
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
              
              {/* Theme Toggle */}
              {mounted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              )}

              {/* Always-visible version badge (helps confirm deploy + caching state) */}
              {userMode === 'vip' && (
                <Badge 
                  variant="outline" 
                  className="font-mono text-[10px] bg-amber-50 text-amber-700 border-amber-200"
                >
                  VIP
                </Badge>
              )}
              {userMode === 'admin' && (
                <Badge 
                  variant="outline" 
                  className="font-mono text-[10px] bg-purple-50 text-purple-700 border-purple-200 hidden sm:inline-flex"
                >
                  ADMIN
                </Badge>
              )}
              {isDev && (
                <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground/80 border-muted-foreground/30" title="Build-time variant (NEXT_PUBLIC_VARIANT)">
                  {getVariantId()}
                </Badge>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="ml-1">
                    <Badge
                      variant="outline"
                      className="font-mono text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                      title="What’s new"
                    >
                      v{APP_VERSION}
                    </Badge>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80">
                  <div className="space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div className="font-semibold text-sm">What’s new</div>
                      <div className="text-[10px] text-muted-foreground font-mono">v{APP_VERSION}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {APP_VERSION_LABEL} • Built {APP_BUILD_DATE}
                    </div>
                    <div className="space-y-3">
                      {CHANGELOG.slice(0, 3).map((entry) => (
                        <div key={entry.version} className="space-y-1">
                          <div className="text-xs font-medium text-foreground">
                            v{entry.version}{entry.title ? ` — ${entry.title}` : ""}
                          </div>
                          <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1">
                            {entry.changes.slice(0, 4).map((c) => (
                              <li key={c}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
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
                    <Link href="/admin/batch-scan" className="flex items-center gap-2 cursor-pointer">
                      <Layers className="h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">Batch Scanner</div>
                        <div className="text-xs text-muted-foreground">
                          Bulk process multiple ISBNs
                        </div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dev/check-covers" className="flex items-center gap-2 cursor-pointer">
                      <ImageIcon className="h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">Check Book Covers</div>
                        <div className="text-xs text-muted-foreground">
                          Validate covers for existing books
                        </div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-center gap-2 cursor-default">
                    <Info className="h-4 w-4" />
                    <div className="flex-1">
                      <div className="font-medium">{APP_VERSION_LABEL}</div>
                      <div className="text-xs text-muted-foreground">
                        Version {APP_VERSION} • Built {APP_BUILD_DATE}
                      </div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              )}
            </div>
          </div>
        </div>

      </nav>

      {/* Mobile Navigation - Bottom Bar PWA Style */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {visibleNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-md text-xs font-medium transition-colors flex-1 max-w-[80px] min-w-0",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive && "text-primary"
                )} />
                <span className="text-[10px] leading-tight truncate w-full text-center">{item.name}</span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
