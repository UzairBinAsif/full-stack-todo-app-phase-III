"use client"

import { useState } from "react"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToggleCompleteMutation, useDeleteTaskMutation } from "@/hooks/use-tasks"
import { TaskDialog } from "./task-dialog"
import type { Task } from "@/types/task"

interface TaskItemProps {
  task: Task
}

export function TaskItem({ task }: TaskItemProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const toggleComplete = useToggleCompleteMutation()
  const deleteTask = useDeleteTaskMutation()

  const handleDelete = () => {
    deleteTask.mutate(task.id)
  }

  return (
    <>
      <div
        className={cn(
          "group flex items-center gap-3 rounded-lg border bg-card p-4",
          "transition-all hover:shadow-sm hover:bg-accent/50",
          task.completed && "opacity-60"
        )}
      >
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => toggleComplete.mutate(task.id)}
          aria-label={`Mark "${task.title}" as ${task.completed ? "incomplete" : "complete"}`}
        />

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "font-medium truncate",
              task.completed && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </p>
          {task.description && (
            <p className="text-sm text-muted-foreground truncate">
              {task.description}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              aria-label={`Actions for "${task.title}"`}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open task actions menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TaskDialog
        task={task}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  )
}
