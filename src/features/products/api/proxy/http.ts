import { NextResponse } from "next/server"
import type { ProductRequestMethod } from "./types"

const BACKEND_URL = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL
const DEFAULT_HEADERS = {
  "User-Agent": "Mozilla/5.0",
  Accept: "application/json",
} as const

function requireBackendUrl() {
  if (!BACKEND_URL) {
    throw new Error("BACKEND_URL or NEXT_PUBLIC_BACKEND_URL is not set")
  }

  return BACKEND_URL
}

function createHeaders(authHeader?: string, includeJsonContentType = false): HeadersInit {
  const headers: HeadersInit = {
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

export async function parseJsonOrText(response: Response) {
  const contentType = response.headers.get("content-type")
  const isJson = contentType?.includes("application/json")

  if (isJson) {
    const data = await response.json().catch(() => null)
    return { isJson: true, data }
  }

  const text = await response.text().catch(() => "")
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

  return fetch(`${baseUrl}/api/products/${id}`, {
    method,
    cache: method === "GET" ? "no-store" : "default",
    headers: createHeaders(authHeader ?? undefined, method === "PUT"),
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export async function buildErrorResponse(response: Response) {
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
