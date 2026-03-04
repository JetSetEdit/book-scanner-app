"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowUpDown } from "lucide-react"

export function CollectionSort() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get("sort") || "newest"

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "newest") {
      params.delete("sort")
    } else {
      params.set("sort", value)
    }
    router.push(`/bookshelf?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
      <Select value={currentSort} onValueChange={handleSortChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest First</SelectItem>
          <SelectItem value="title-asc">Title A-Z</SelectItem>
          <SelectItem value="title-desc">Title Z-A</SelectItem>
          <SelectItem value="author-asc">Author A-Z</SelectItem>
          <SelectItem value="severity-desc">Severity (High to Low)</SelectItem>
          <SelectItem value="severity-asc">Severity (Low to High)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

