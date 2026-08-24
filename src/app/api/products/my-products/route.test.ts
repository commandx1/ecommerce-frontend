import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, record, routeRequest } from "@/test/route-harness"
import { GET } from "./route"

const UPSTREAM = `${BACKEND}/api/products/my-products`
const page = { content: [{ id: "p-1", approved: null }], totalElements: 1, totalPages: 1 }

const authCookie = (token: string) =>
  `auth-storage=${encodeURIComponent(JSON.stringify({ state: { accessToken: token } }))}`

describe("GET /api/products/my-products", () => {
  it("passes the caller's whole query string through untouched", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(page)
      }),
    )

    const response = await GET(
      routeRequest("/api/products/my-products?approved=FALSE&sortBy=createdAt&sortDir=desc&page=3&size=25", {
        authorization: AUTH,
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(page)

    const url = new URL(captured.url ?? "")
    expect(url.searchParams.get("approved")).toBe("FALSE")
    expect(url.searchParams.get("sortBy")).toBe("createdAt")
    expect(url.searchParams.get("sortDir")).toBe("desc")
    expect(url.searchParams.get("page")).toBe("3")
    expect(url.searchParams.get("size")).toBe("25")
  })

  it("forwards unknown parameters as-is — the route applies no allowlist", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(page)
      }),
    )

    await GET(routeRequest("/api/products/my-products?vendorId=someone-else", { authorization: AUTH }))

    // Pinned: scoping to the caller's own products is entirely the backend's job here.
    expect(new URL(captured.url ?? "").searchParams.get("vendorId")).toBe("someone-else")
  })

  it("accepts the auth-storage cookie as the credential source", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(page)
      }),
    )

    await GET(routeRequest("/api/products/my-products", { cookie: authCookie("cookie-token") }))

    expect(captured.authorization).toBe("Bearer cookie-token")
  })

  it("answers 401 without calling the backend when there is no credential", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(page)
      }),
    )

    const response = await GET(routeRequest("/api/products/my-products"))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" })
    expect(captured.count).toBe(0)
  })

  it.each([400, 403, 500])("forwards the backend JSON error and status %i", async (status) => {
    server.use(http.get(UPSTREAM, () => HttpResponse.json({ message: "nope" }, { status })))

    const response = await GET(routeRequest("/api/products/my-products", { authorization: AUTH }))

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message: "nope" })
  })

  it("returns an empty page when a 2xx carries no JSON", async () => {
    server.use(http.get(UPSTREAM, () => HttpResponse.text("", { status: 204 })))

    const response = await GET(routeRequest("/api/products/my-products", { authorization: AUTH }))

    await expect(response.json()).resolves.toEqual({ content: [], totalElements: 0, totalPages: 0 })
  })

  it("answers 500 without a stack trace when the backend is unreachable", async () => {
    server.use(http.get(UPSTREAM, () => HttpResponse.error()))

    const response = await GET(routeRequest("/api/products/my-products", { authorization: AUTH }))
    const body = (await response.json()) as { message: string }

    expect(response.status).toBe(500)
    expect(body.message).not.toContain("at ")
  })

  it("exposes GET only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["GET"])
  })
})
