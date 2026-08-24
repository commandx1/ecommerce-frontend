import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, record, routeParams, routeRequest } from "@/test/route-harness"
import { GET } from "./route"

/**
 * Product detail payload (product + the vendor offers for it). Public: it renders during SSR for
 * signed-out visitors too, so the token is optional and may come from the auth-storage cookie.
 * This handler rewrites 401/403/404 into user-facing copy — that mapping is the contract here.
 */

const ANY = `${BACKEND}/api/products/*`
const payload = { product: { id: "p-1" }, userProducts: [{ id: "up-1" }] }

const authCookie = (token: string) =>
  `auth-storage=${encodeURIComponent(JSON.stringify({ state: { accessToken: token } }))}`

describe("GET /api/products/[id]/with-user-products", () => {
  it("returns the payload for an anonymous visitor and sends no Authorization header", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(payload)
      }),
    )

    const response = await GET(routeRequest("/api/products/p-1/with-user-products"), routeParams({ id: "p-1" }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(payload)
    expect(captured.url).toBe(`${BACKEND}/api/products/p-1/with-user-products`)
    expect(captured.authorization).toBeNull()
  })

  it("forwards the header token when present", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(payload)
      }),
    )

    await GET(routeRequest("/api/products/p-1/with-user-products", { authorization: AUTH }), routeParams({ id: "p-1" }))

    expect(captured.authorization).toBe(AUTH)
  })

  it("derives the token from the auth-storage cookie during SSR", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(payload)
      }),
    )

    await GET(
      routeRequest("/api/products/p-1/with-user-products", { cookie: authCookie("cookie-token") }),
      routeParams({ id: "p-1" }),
    )

    expect(captured.authorization).toBe("Bearer cookie-token")
  })

  it.each([
    [401, "Authentication required"],
    [403, "You don't have permission to view this product"],
    [404, "Product not found"],
  ])("rewrites an upstream %i into user-facing copy, discarding the backend message", async (status, message) => {
    server.use(http.get(ANY, () => HttpResponse.json({ message: "raw backend detail" }, { status })))

    const response = await GET(
      routeRequest("/api/products/p-1/with-user-products", { authorization: AUTH }),
      routeParams({ id: "p-1" }),
    )

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message })
  })

  it("keeps the backend message for statuses it has no copy for", async () => {
    server.use(http.get(ANY, () => HttpResponse.json({ message: "Upstream is on fire" }, { status: 500 })))

    const response = await GET(
      routeRequest("/api/products/p-1/with-user-products", { authorization: AUTH }),
      routeParams({ id: "p-1" }),
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ message: "Upstream is on fire" })
  })

  it("uses the backend `error` field when there is no `message`", async () => {
    server.use(http.get(ANY, () => HttpResponse.json({ error: "constraint violation" }, { status: 409 })))

    const response = await GET(
      routeRequest("/api/products/p-1/with-user-products", { authorization: AUTH }),
      routeParams({ id: "p-1" }),
    )

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({ message: "constraint violation" })
  })

  it("uses a non-JSON error body as the message", async () => {
    server.use(http.get(ANY, () => HttpResponse.text("plain failure", { status: 500 })))

    const response = await GET(routeRequest("/api/products/p-1/with-user-products"), routeParams({ id: "p-1" }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ message: "plain failure" })
  })

  it("answers 500 when a 2xx body is not JSON", async () => {
    server.use(http.get(ANY, () => HttpResponse.text("plain", { status: 200 })))

    const response = await GET(routeRequest("/api/products/p-1/with-user-products"), routeParams({ id: "p-1" }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ message: "Internal server error" })
  })

  it("answers 500 without a stack trace when the backend is unreachable", async () => {
    server.use(http.get(ANY, () => HttpResponse.error()))

    const response = await GET(routeRequest("/api/products/p-1/with-user-products"), routeParams({ id: "p-1" }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ message: "Internal server error" })
  })

  it("re-fetches on every call instead of serving a cached body", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(payload)
      }),
    )

    await GET(routeRequest("/api/products/p-1/with-user-products"), routeParams({ id: "p-1" }))
    await GET(routeRequest("/api/products/p-1/with-user-products"), routeParams({ id: "p-1" }))

    expect(captured.count).toBe(2)
  })

  it("exposes GET only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["GET"])
  })
})
