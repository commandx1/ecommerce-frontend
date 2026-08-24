import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, jsonRequest, record, routeRequest } from "@/test/route-harness"
import { GET, POST } from "./route"

/**
 * The vendor's own offers. The GET has a notable quirk: when the backend answers 403 it silently
 * retries against `/api/user-products/filter?type=TOTAL` with a 1000-row page and returns that
 * instead. These tests pin both the fallback and the shapes it can unwrap.
 */

const LIST = `${BACKEND}/api/user-products`
const FILTER = `${BACKEND}/api/user-products/filter`
const userProduct = { id: "up-1", productId: "p-1", price: 10, stock: 5, active: true }

const authCookie = (token: string) =>
  `auth-storage=${encodeURIComponent(JSON.stringify({ state: { accessToken: token } }))}`

describe("GET /api/user-products", () => {
  it("returns the backend list and forwards the Authorization header", async () => {
    const captured = createCapture()
    server.use(
      http.get(LIST, ({ request }) => {
        record(captured, request)
        return HttpResponse.json([userProduct])
      }),
    )

    const response = await GET(routeRequest("/api/user-products", { authorization: AUTH }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([userProduct])
    expect(captured.authorization).toBe(AUTH)
  })

  it("accepts the auth-storage cookie as the credential source", async () => {
    const captured = createCapture()
    server.use(
      http.get(LIST, ({ request }) => {
        record(captured, request)
        return HttpResponse.json([])
      }),
    )

    await GET(routeRequest("/api/user-products", { cookie: authCookie("cookie-token") }))

    expect(captured.authorization).toBe("Bearer cookie-token")
  })

  it("answers 401 without calling the backend when there is no credential", async () => {
    const captured = createCapture()
    server.use(
      http.get(LIST, ({ request }) => {
        record(captured, request)
        return HttpResponse.json([])
      }),
    )

    const response = await GET(routeRequest("/api/user-products"))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" })
    expect(captured.count).toBe(0)
  })

  it("falls back to the filter endpoint on 403 and unwraps `content`", async () => {
    const captured = createCapture()
    server.use(
      http.get(LIST, () => HttpResponse.json({ message: "forbidden" }, { status: 403 })),
      http.get(FILTER, ({ request }) => {
        record(captured, request)
        return HttpResponse.json({ content: [userProduct], totalElements: 1 })
      }),
    )

    const response = await GET(routeRequest("/api/user-products", { authorization: AUTH }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([userProduct])

    const url = new URL(captured.url ?? "")
    expect(url.searchParams.get("type")).toBe("TOTAL")
    expect(url.searchParams.get("page")).toBe("0")
    expect(url.searchParams.get("size")).toBe("1000")
    expect(captured.authorization).toBe(AUTH)
  })

  it.each([
    ["a bare array", [userProduct]],
    ["a paged object", { content: [userProduct] }],
    ["a nested data.content object", { data: { content: [userProduct] } }],
  ])("unwraps %s from the fallback payload", async (_label, payload) => {
    server.use(
      http.get(LIST, () => new HttpResponse(null, { status: 403 })),
      http.get(FILTER, () => HttpResponse.json(payload)),
    )

    const response = await GET(routeRequest("/api/user-products", { authorization: AUTH }))

    await expect(response.json()).resolves.toEqual([userProduct])
  })

  it("returns an empty list when the fallback payload has an unrecognised shape", async () => {
    server.use(
      http.get(LIST, () => new HttpResponse(null, { status: 403 })),
      http.get(FILTER, () => HttpResponse.json({ items: [userProduct] })),
    )

    const response = await GET(routeRequest("/api/user-products", { authorization: AUTH }))

    // Pinned, not endorsed: an unexpected backend shape reads as "vendor has no products"
    // rather than as an error.
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([])
  })

  it("surfaces the fallback's own failure when it also fails", async () => {
    server.use(
      http.get(LIST, () => new HttpResponse(null, { status: 403 })),
      http.get(FILTER, () => HttpResponse.json({ message: "still forbidden" }, { status: 403 })),
    )

    const response = await GET(routeRequest("/api/user-products", { authorization: AUTH }))

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ message: "still forbidden" })
  })

  it("does not retry on a 401 — only 403 triggers the fallback", async () => {
    const captured = createCapture()
    server.use(
      http.get(LIST, () => HttpResponse.json({ message: "expired" }, { status: 401 })),
      http.get(FILTER, ({ request }) => {
        record(captured, request)
        return HttpResponse.json({ content: [] })
      }),
    )

    const response = await GET(routeRequest("/api/user-products", { authorization: AUTH }))

    expect(response.status).toBe(401)
    expect(captured.count).toBe(0)
  })

  it("returns an empty list when a 2xx carries no JSON", async () => {
    server.use(http.get(LIST, () => HttpResponse.text("", { status: 204 })))

    const response = await GET(routeRequest("/api/user-products", { authorization: AUTH }))

    await expect(response.json()).resolves.toEqual([])
  })

  it("answers 500 without a stack trace when the backend is unreachable", async () => {
    server.use(http.get(LIST, () => HttpResponse.error()))

    const response = await GET(routeRequest("/api/user-products", { authorization: AUTH }))
    const body = (await response.json()) as { message: string }

    expect(response.status).toBe(500)
    expect(body.message).not.toContain("at ")
  })
})

describe("POST /api/user-products", () => {
  it("forwards the Authorization header and the JSON body", async () => {
    const captured = createCapture()
    let body: unknown = null
    server.use(
      http.post(LIST, async ({ request }) => {
        record(captured, request)
        body = await request.json()
        return HttpResponse.json(userProduct)
      }),
    )

    const response = await POST(
      jsonRequest("/api/user-products", { productId: "p-1", price: 10 }, { authorization: AUTH }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(userProduct)
    expect(captured.authorization).toBe(AUTH)
    expect(body).toEqual({ productId: "p-1", price: 10 })
  })

  it("requires the header — it does NOT accept the auth-storage cookie the GET accepts", async () => {
    const captured = createCapture()
    server.use(
      http.post(LIST, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(userProduct)
      }),
    )

    const response = await POST(
      jsonRequest("/api/user-products", { productId: "p-1" }, { cookie: authCookie("cookie-token") }),
    )

    // Pinned inconsistency between the two verbs of the same route file.
    expect(response.status).toBe(401)
    expect(captured.count).toBe(0)
  })

  it.each([400, 403, 409, 500])("forwards the backend JSON error and status %i", async (status) => {
    server.use(http.post(LIST, () => HttpResponse.json({ message: "rejected" }, { status })))

    const response = await POST(jsonRequest("/api/user-products", { productId: "p-1" }, { authorization: AUTH }))

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message: "rejected" })
  })

  it("returns a success envelope when a 2xx carries no JSON", async () => {
    server.use(http.post(LIST, () => HttpResponse.text("", { status: 201 })))

    const response = await POST(jsonRequest("/api/user-products", { productId: "p-1" }, { authorization: AUTH }))

    await expect(response.json()).resolves.toEqual({ success: true })
  })

  it("answers 500 when the request body is not JSON", async () => {
    const response = await POST(
      routeRequest("/api/user-products", { method: "POST", authorization: AUTH, body: "not-json" }),
    )

    expect(response.status).toBe(500)
  })
})

describe("/api/user-products route surface", () => {
  it("exposes GET and POST only", async () => {
    const route = await import("./route")

    expect(Object.keys(route).sort()).toEqual(["GET", "POST"])
  })
})
