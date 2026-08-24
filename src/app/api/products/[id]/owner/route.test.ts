import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, record, routeParams, routeRequest } from "@/test/route-harness"
import { GET } from "./route"

/** Owner/admin view of a product: same proxy as `/api/products/:id` but with `/owner` appended. */

const ANY = `${BACKEND}/api/products/*`
const product = { id: "p-1", name: "Composite Kit", active: false }

describe("GET /api/products/[id]/owner", () => {
  it("appends /owner to the upstream path and forwards the Authorization header", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(product)
      }),
    )

    const response = await GET(
      routeRequest("/api/products/p-1/owner", { authorization: AUTH }),
      routeParams({ id: "p-1" }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(product)
    expect(captured.url).toBe(`${BACKEND}/api/products/p-1/owner`)
    expect(captured.authorization).toBe(AUTH)
  })

  it("answers 401 without calling the backend when unauthenticated", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(product)
      }),
    )

    const response = await GET(routeRequest("/api/products/p-1/owner"), routeParams({ id: "p-1" }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" })
    expect(captured.count).toBe(0)
  })

  it("relies entirely on the backend for the ownership check", async () => {
    server.use(http.get(ANY, () => HttpResponse.json({ message: "Not the owner" }, { status: 403 })))

    const response = await GET(
      routeRequest("/api/products/p-1/owner", { authorization: AUTH }),
      routeParams({ id: "p-1" }),
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ message: "Not the owner" })
  })

  it("forwards a 404 for a product that does not exist", async () => {
    server.use(http.get(ANY, () => HttpResponse.json({ message: "Product not found" }, { status: 404 })))

    const response = await GET(
      routeRequest("/api/products/missing/owner", { authorization: AUTH }),
      routeParams({ id: "missing" }),
    )

    expect(response.status).toBe(404)
  })

  it("wraps a non-JSON error body in a message envelope", async () => {
    server.use(http.get(ANY, () => HttpResponse.text("gateway", { status: 502 })))

    const response = await GET(
      routeRequest("/api/products/p-1/owner", { authorization: AUTH }),
      routeParams({ id: "p-1" }),
    )

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ message: "gateway", status: 502 })
  })

  it("answers 500 when a 2xx does not carry JSON", async () => {
    server.use(http.get(ANY, () => HttpResponse.text("plain", { status: 200 })))

    const response = await GET(
      routeRequest("/api/products/p-1/owner", { authorization: AUTH }),
      routeParams({ id: "p-1" }),
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ message: "Invalid response from server" })
  })

  it("answers 500 without a stack trace when the backend is unreachable", async () => {
    server.use(http.get(ANY, () => HttpResponse.error()))

    const response = await GET(
      routeRequest("/api/products/p-1/owner", { authorization: AUTH }),
      routeParams({ id: "p-1" }),
    )
    const body = (await response.json()) as { message: string }

    expect(response.status).toBe(500)
    expect(body.message).not.toContain("at ")
  })

  it("exposes GET only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["GET"])
  })
})
