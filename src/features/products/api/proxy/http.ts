import type { AxiosResponse } from "axios"
import { NextResponse } from "next/server"
import { apiRequest } from "@/lib/api/request"
import type { ProductRequestMethod } from "./types"

const BACKEND_URL = process.env.BACKEND_URL ?? 'localhost:8080'
const DEFAULT_HEADERS = {
  "User-Agent": "Mozilla/5.0",
  Accept: "application/json",
} as const

function requireBackendUrl() {
  if (!BACKEND_URL) {
    throw new Error("BACKEND_URL or BACKEND_URL is not set")
  }

  return BACKEND_URL
}

function createHeaders(authHeader?: string, includeJsonContentType = false): Record<string, string> {
  const headers: Record<string, string> = {
    ...DEFAULT_HEADERS,
  }

  if (includeJsonContentType) {
    headers["Content-Type"] = "application/json"
  }

  if (authHeader) {
    headers.Authorization = authHeader
  }

  return headers
}

export async function parseJsonOrText(response: AxiosResponse) {
  const contentType = response.headers["content-type"]
  const isJson = typeof contentType === "string" && contentType.includes("application/json")

  if (isJson) {
    return { isJson: true, data: response.data }
  }

  const text = typeof response.data === "string" ? response.data : ""
  return { isJson: false, data: text.trim() }
}

export async function proxyRequest({
  id,
  method,
  authHeader,
  body,
}: {
  id: string
  method: ProductRequestMethod
  authHeader?: string | null
  body?: unknown
}) {
  const baseUrl = requireBackendUrl()

  return apiRequest.requestResponse<unknown>({
    client: "app",
    method,
    url: `${baseUrl}/api/products/${id}`,
    headers: createHeaders(authHeader ?? undefined, method === "PUT"),
    data: body,
    validateStatus: () => true,
    fallbackMessage: "Product proxy request failed",
  })
}

export async function buildErrorResponse(response: AxiosResponse) {
  const parsed = await parseJsonOrText(response)

  if (parsed.isJson && parsed.data) {
    return NextResponse.json(parsed.data, { status: response.status })
  }

  return NextResponse.json(
    {
      message:
        typeof parsed.data === "string" && parsed.data ? parsed.data : `Request failed with status ${response.status}`,
      status: response.status,
    },
    { status: response.status },
  )
}
