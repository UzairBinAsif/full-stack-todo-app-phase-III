export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiErrorResponse {
  message: string
  statusCode: number
  error?: string
}
