import { authClient } from "./auth-client"
import type { Task, CreateTaskInput, UpdateTaskInput, TaskFilters } from "@/types/task"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const session = await authClient.getSession()

  if (!session?.data?.session) {
    throw new ApiError(401, "Not authenticated")
  }

  // Use Better Auth session token (backend will verify it against database)
  const token = session.data.session.token
  const userId = session.data.user.id

  const response = await fetch(`${API_BASE}/api/${userId}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (response.status === 401) {
    await authClient.signOut()
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    throw new ApiError(401, "Session expired")
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }))
    throw new ApiError(response.status, error.message || "Request failed")
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

export const tasksApi = {
  getAll: (filters?: TaskFilters): Promise<Task[]> => {
    const params = new URLSearchParams()
    if (filters?.status && filters.status !== "all") {
      params.set("status", filters.status)
    }
    if (filters?.sort) {
      params.set("sort", filters.sort)
    }
    const query = params.toString()
    return fetchWithAuth(`/tasks${query ? `?${query}` : ""}`)
  },

  getOne: (id: number): Promise<Task> => fetchWithAuth(`/tasks/${id}`),

  create: (data: CreateTaskInput): Promise<Task> =>
    fetchWithAuth("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: UpdateTaskInput): Promise<Task> =>
    fetchWithAuth(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number): Promise<void> =>
    fetchWithAuth(`/tasks/${id}`, { method: "DELETE" }),

  toggleComplete: (id: number): Promise<Task> =>
    fetchWithAuth(`/tasks/${id}/complete`, { method: "PATCH" }),
}
