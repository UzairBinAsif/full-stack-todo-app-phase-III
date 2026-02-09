"use client"

import { useTasksQuery } from "@/hooks/use-tasks"
import { TaskItem } from "./task-item"
import { EmptyState } from "./empty-state"
import { LoadingSkeleton } from "./loading-skeleton"
import type { TaskFilters } from "@/types/task"

interface TaskListProps {
  filters?: TaskFilters
}

export function TaskList({ filters }: TaskListProps) {
  const { data: tasks, isLoading, error } = useTasksQuery(filters)

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        <p>Failed to load tasks.</p>
        <p className="text-sm text-muted-foreground mt-1">Please try again later.</p>
      </div>
    )
  }

  if (!tasks?.length) {
    return <EmptyState />
  }

  return (
    <div className="space-y-2">
      {tasks.map((task, index) => (
        <div
          key={task.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <TaskItem task={task} />
        </div>
      ))}
    </div>
  )
}
