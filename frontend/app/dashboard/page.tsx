"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { TaskForm } from "@/components/todo/task-form"
import { TaskList } from "@/components/todo/task-list"
import { TaskFiltersComponent } from "@/components/todo/task-filters"
import type { TaskFilters } from "@/types/task"

function DashboardContent() {
  const searchParams = useSearchParams()
  const status = searchParams.get("status") as TaskFilters["status"] | null
  const sort = searchParams.get("sort") as TaskFilters["sort"] | null

  const filters: TaskFilters = {
    ...(status && { status }),
    ...(sort && { sort }),
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>
        <p className="text-muted-foreground">Manage your daily tasks</p>
      </div>

      <TaskForm />

      <Suspense fallback={null}>
        <TaskFiltersComponent />
      </Suspense>

      <TaskList filters={Object.keys(filters).length > 0 ? filters : undefined} />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl p-6">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
