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

  constructor(message: string, options?: { status?: number; data?: unknown; authHandled?: boolean }) {
    super(message)
    this.name = "ApiRequestError"
    this.status = options?.status
    this.data = options?.data
    this.authHandled = options?.authHandled
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

function extractErrorMessage(data: unknown, fallbackMessage: string): string {
  if (!data || typeof data !== "object") {
    return fallbackMessage
  }

  if ("message" in data && typeof data.message === "string" && data.message.trim()) {
    return data.message
  }

  if ("error" in data && typeof data.error === "string" && data.error.trim()) {
    return data.error
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
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    let data = error.response?.data
    if (data instanceof Blob) {
      data = await parseBlobErrorData(data)
    }
    const message = extractErrorMessage(data, fallbackMessage)

    return new ApiRequestError(message, {
      status,
      data,
      authHandled: Boolean((error as { authHandled?: boolean }).authHandled),
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
