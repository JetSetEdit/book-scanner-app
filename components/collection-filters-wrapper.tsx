"use client"

import { useState } from "react"
import { CollectionFilters, MobileFilterButton, FilterCounts } from "./collection-filters"

interface CollectionFiltersWrapperProps {
    counts?: FilterCounts
}

export function CollectionFiltersWrapper({ counts }: CollectionFiltersWrapperProps) {
    const [mobileOpen, setMobileOpen] = useState(false)

    return (
        <>
            {/* Desktop sidebar - hidden on mobile */}
            <aside className="hidden lg:block w-60 flex-shrink-0">
                <div className="sticky top-4">
                    <CollectionFilters counts={counts} />
                </div>
            </aside>

            {/* Mobile filter button + drawer */}
            <div className="lg:hidden">
                <MobileFilterButton onClick={() => setMobileOpen(true)} />
                {mobileOpen && (
                    <div
                        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    >
                        <div
                            className="fixed inset-y-0 left-0 z-50 w-72 bg-background p-6 shadow-lg border-r"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold">Filters</h2>
                                <button
                                    onClick={() => setMobileOpen(false)}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    ✕
                                </button>
                            </div>
                            <CollectionFilters counts={counts} />
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
