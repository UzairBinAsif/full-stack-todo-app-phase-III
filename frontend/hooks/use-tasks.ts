"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { tasksApi } from "@/lib/api"
import type { Task, CreateTaskInput, UpdateTaskInput, TaskFilters } from "@/types/task"
import { toast } from "sonner"

const TASKS_KEY = ["tasks"]

export function useTasksQuery(filters?: TaskFilters) {
  return useQuery({
    queryKey: [...TASKS_KEY, filters],
    queryFn: () => tasksApi.getAll(filters),
    staleTime: 1000 * 60,
  })
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tasksApi.create,
    onMutate: async (newTask: CreateTaskInput) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY })

      const previousTasks = queryClient.getQueryData<Task[]>(TASKS_KEY)

      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) => [
        {
          id: Date.now(),
          ...newTask,
          description: newTask.description ?? null,
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...(old ?? []),
      ])

      return { previousTasks }
    },
    onError: (_err, _newTask, context) => {
      queryClient.setQueryData(TASKS_KEY, context?.previousTasks)
      toast.error("Failed to create task")
    },
    onSuccess: () => {
      toast.success("Task created")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY })
    },
  })
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTaskInput }) =>
      tasksApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY })

      const previousTasks = queryClient.getQueryData<Task[]>(TASKS_KEY)

      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
        old?.map((task) =>
          task.id === id ? { ...task, ...data, updatedAt: new Date().toISOString() } : task
        )
      )

      return { previousTasks }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(TASKS_KEY, context?.previousTasks)
      toast.error("Failed to update task")
    },
    onSuccess: () => {
      toast.success("Task updated")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY })
    },
  })
}

export function useToggleCompleteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tasksApi.toggleComplete,
    onMutate: async (taskId: number) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY })

      const previousTasks = queryClient.getQueryData<Task[]>(TASKS_KEY)

      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
        old?.map((task) =>
          task.id === taskId
            ? { ...task, completed: !task.completed, updatedAt: new Date().toISOString() }
            : task
        )
      )

      return { previousTasks }
    },
    onError: (_err, _taskId, context) => {
      queryClient.setQueryData(TASKS_KEY, context?.previousTasks)
      toast.error("Failed to update task")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY })
    },
  })
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tasksApi.delete,
    onMutate: async (taskId: number) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY })

      const previousTasks = queryClient.getQueryData<Task[]>(TASKS_KEY)

      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
        old?.filter((task) => task.id !== taskId)
      )

      return { previousTasks }
    },
    onError: (_err, _taskId, context) => {
      queryClient.setQueryData(TASKS_KEY, context?.previousTasks)
      toast.error("Failed to delete task")
    },
    onSuccess: () => {
      toast.success("Task deleted")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY })
    },
  })
}
