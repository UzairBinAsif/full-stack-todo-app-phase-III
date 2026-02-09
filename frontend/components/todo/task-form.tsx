"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCreateTaskMutation } from "@/hooks/use-tasks"
import { taskSchema, type TaskFormData } from "@/lib/validations"

export function TaskForm() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
    },
  })

  const createTask = useCreateTaskMutation()

  const onSubmit = (data: TaskFormData) => {
    createTask.mutate(data, {
      onSuccess: () => reset(),
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2" role="form" aria-label="Add new task">
      <div className="flex-1">
        <Input
          {...register("title")}
          placeholder="Add a new task..."
          autoComplete="off"
          className={errors.title ? "border-destructive" : ""}
          aria-label="Task title"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "title-error" : undefined}
        />
        {errors.title && (
          <p id="title-error" className="text-xs text-destructive mt-1" role="alert">
            {errors.title.message}
          </p>
        )}
      </div>
      <Button type="submit" disabled={createTask.isPending} aria-label="Add task">
        {createTask.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span className="sr-only">Creating task...</span>
          </>
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Add
          </>
        )}
      </Button>
    </form>
  )
}
