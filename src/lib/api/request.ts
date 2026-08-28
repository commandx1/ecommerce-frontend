import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios"
import apiClient, { appApiClient } from "./client"

type ClientTarget = "app" | "backend" | AxiosInstance

type RequestConfig<TBody = unknown> = {
  client?: ClientTarget
  data?: TBody
  fallbackMessage?: string
} & Omit<AxiosRequestConfig<TBody>, "data">

export class ApiRequestError extends Error {
  status?: number
  data?: unknown
  authHandled?: boolean
  code?: string

  constructor(message: string, options?: { status?: number; data?: unknown; authHandled?: boolean; code?: string }) {
    super(message)
    this.name = "ApiRequestError"
    this.status = options?.status
    this.data = options?.data
    this.authHandled = options?.authHandled
    this.code = options?.code
  }
}

function resolveClient(client?: ClientTarget): AxiosInstance {
  if (!client || client === "app") {
    return appApiClient
  }

  if (client === "backend") {
    return apiClient
  }

  return client
}

function extractErrorMessage(data: unknown, fallbackMessage: string, status?: number): string {
  if (!data || typeof data !== "object") {
    return fallbackMessage
  }

  if ("message" in data && typeof data.message === "string" && data.message.trim()) {
    return data.message
  }

  if ("error" in data && typeof data.error === "string" && data.error.trim()) {
    return data.error
  }

  // GlobalExceptionHandler.handleValidationExceptions (ecommerce-api
  // auth/exception/GlobalExceptionHandler.java) - the handler for @Valid bean-validation
  // failures (e.g. CompanyUpdateRequest's @NotBlank/@Email/@Size, CreateLicenseRequest's
  // @NotNull/@Min/@Max) - has no `message`/`error`/`status` envelope at all. It returns a flat
  // `Map<String, String>` of `{ fieldName: violationMessage }` directly as the body, e.g.
  // `{ "name": "Company name cannot be left blank" }`. Without this branch, every such 400
  // silently falls through to `fallbackMessage`, hiding a specific, actionable message the
  // backend already computed.
  //
  // Gated on 400 on purpose: that handler only ever runs for MethodArgumentNotValidException,
  // which is always a 400. Without the gate any other status whose body happens to be a flat
  // string map - e.g. a 500 returning `{ code: "x" }` - would be read as a field error and its
  // opaque value shown to the user instead of the caller's fallback. Also require every value to
  // be a non-empty string, so an unrelated object shape still falls back safely.
  if (status === 400 && !Array.isArray(data)) {
    const values = Object.values(data as Record<string, unknown>)
    if (values.length > 0 && values.every((value) => typeof value === "string" && value.trim())) {
      return values[0] as string
    }
  }

  return fallbackMessage
}

async function parseBlobErrorData(data: Blob): Promise<unknown> {
  try {
    const text = await data.text()
    return text ? JSON.parse(text) : data
  } catch {
    return data
  }
}

async function toApiRequestError(error: unknown, fallbackMessage: string): Promise<ApiRequestError> {
  // Preserve cancellation identity: axios wraps AbortController aborts as an
  // AxiosError with code "ERR_CANCELED" (axios.isCancel(error) === true).
  // Without carrying `code`/`name` through, callers can't distinguish an
  // aborted (stale, expected) request from a genuine network/API failure.
  if (axios.isCancel(error)) {
    const canceledMessage = error instanceof Error ? error.message || fallbackMessage : fallbackMessage
    const apiError = new ApiRequestError(canceledMessage, { code: "ERR_CANCELED" })
    apiError.name = "CanceledError"
    return apiError
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    let data = error.response?.data
    if (data instanceof Blob) {
      data = await parseBlobErrorData(data)
    }
    const message = extractErrorMessage(data, fallbackMessage, status)

    return new ApiRequestError(message, {
      status,
      data,
      authHandled: Boolean((error as { authHandled?: boolean }).authHandled),
      code: error.code,
    })
  }

  if (error instanceof Error) {
    return new ApiRequestError(error.message || fallbackMessage)
  }

  return new ApiRequestError(fallbackMessage)
}

async function requestResponse<TResponse = unknown, TBody = unknown>(
  config: RequestConfig<TBody>,
): Promise<AxiosResponse<TResponse, TBody>> {
  const { client, fallbackMessage = "Request failed", ...axiosConfig } = config
  const resolvedClient = resolveClient(client)

  try {
    return await resolvedClient.request<TResponse, AxiosResponse<TResponse, TBody>, TBody>(axiosConfig)
  } catch (error: unknown) {
    throw await toApiRequestError(error, fallbackMessage)
  }
}

async function requestJson<TResponse = unknown, TBody = unknown>(config: RequestConfig<TBody>): Promise<TResponse> {
  const response = await requestResponse<TResponse, TBody>(config)
  return response.data
}

export const apiRequest = {
  requestJson,
  requestResponse,
}
