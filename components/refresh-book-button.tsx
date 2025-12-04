"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner" // Assuming you have sonner or similar, if not I'll use simple alert or just console

export function RefreshBookButton({ isbn }: { isbn: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleRefresh = async (e: React.MouseEvent) => {
        e.preventDefault() // Prevent navigation if inside a Link
        e.stopPropagation() // Prevent bubbling

        if (loading) return
        setLoading(true)

        try {
            const response = await fetch("/api/scan-isbn", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isbn }),
            })

            if (!response.ok) {
                throw new Error("Failed to refresh book")
            }

            // Force a router refresh to update the server component data
            router.refresh()
        } catch (error) {
            console.error("Error refreshing book:", error)
            alert("Failed to refresh book metadata")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh Metadata & Cover"
        >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh Book</span>
        </Button>
    )
}
