"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { TaskFilters } from "@/types/task"

export function TaskFiltersComponent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentStatus = (searchParams.get("status") as TaskFilters["status"]) || "all"
  const currentSort = (searchParams.get("sort") as TaskFilters["sort"]) || "created"

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value === "all" && key === "status") {
      params.delete("status")
    } else if (value === "created" && key === "sort") {
      params.delete("sort")
    } else {
      params.set(key, value)
    }

    // Remove 'filter' param if it exists (legacy from sidebar)
    params.delete("filter")

    const queryString = params.toString()
    router.push(`/dashboard${queryString ? `?${queryString}` : ""}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Status:</span>
        <Select
          value={currentStatus}
          onValueChange={(value) => updateParams("status", value)}
        >
          <SelectTrigger className="w-[130px]" aria-label="Filter by status">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sort:</span>
        <Select
          value={currentSort}
          onValueChange={(value) => updateParams("sort", value)}
        >
          <SelectTrigger className="w-[130px]" aria-label="Sort tasks">
            <SelectValue placeholder="Created" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created">Created Date</SelectItem>
            <SelectItem value="title">Title</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(currentStatus !== "all" || currentSort !== "created") && (
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
