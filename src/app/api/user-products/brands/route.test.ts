import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, record, routeRequest } from "@/test/route-harness"
import { GET } from "./route"

const UPSTREAM = `${BACKEND}/api/user-products/brands`

const authCookie = (token: string) =>
  `auth-storage=${encodeURIComponent(JSON.stringify({ state: { accessToken: token } }))}`

describe("GET /api/user-products/brands", () => {
  it("returns the vendor's distinct brands and forwards the Authorization header", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(["MARK3", "3M"])
      }),
    )

    const response = await GET(routeRequest("/api/user-products/brands", { authorization: AUTH }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(["MARK3", "3M"])
    expect(captured.url).toBe(UPSTREAM)
    expect(captured.authorization).toBe(AUTH)
  })

  it("accepts the auth-storage cookie as the credential source", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json([])
      }),
    )

    await GET(routeRequest("/api/user-products/brands", { cookie: authCookie("cookie-token") }))

    expect(captured.authorization).toBe("Bearer cookie-token")
  })

  it("answers 401 without calling the backend when there is no credential", async () => {
    const captured = createCapture()
    server.use(
      http.get(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json([])
      }),
    )

    const response = await GET(routeRequest("/api/user-products/brands"))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" })
    expect(captured.count).toBe(0)
  })

  it("distinguishes an empty brand list from a failure", async () => {
    server.use(http.get(UPSTREAM, () => HttpResponse.json([])))

    const response = await GET(routeRequest("/api/user-products/brands", { authorization: AUTH }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([])
  })

  it.each([403, 500])("forwards the backend JSON error and status %i", async (status) => {
    server.use(http.get(UPSTREAM, () => HttpResponse.json({ message: "nope" }, { status })))

    const response = await GET(routeRequest("/api/user-products/brands", { authorization: AUTH }))

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message: "nope" })
  })

  it("describes a non-JSON error with the upstream status", async () => {
    server.use(http.get(UPSTREAM, () => HttpResponse.text("gateway", { status: 502 })))

    const response = await GET(routeRequest("/api/user-products/brands", { authorization: AUTH }))

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ message: "Request failed with status 502", status: 502 })
  })

  it("returns an empty list when a 2xx carries no JSON", async () => {
    server.use(http.get(UPSTREAM, () => HttpResponse.text("", { status: 204 })))

    const response = await GET(routeRequest("/api/user-products/brands", { authorization: AUTH }))

    await expect(response.json()).resolves.toEqual([])
  })

  it("answers 500 without a stack trace when the backend is unreachable", async () => {
    server.use(http.get(UPSTREAM, () => HttpResponse.error()))

    const response = await GET(routeRequest("/api/user-products/brands", { authorization: AUTH }))
    const body = (await response.json()) as { message: string }

    expect(response.status).toBe(500)
    expect(body.message).not.toContain("at ")
  })

  it("exposes GET only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["GET"])
  })
})
