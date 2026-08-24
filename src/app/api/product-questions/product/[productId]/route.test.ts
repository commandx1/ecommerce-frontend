import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, record, routeParams, routeRequest } from "@/test/route-harness"
import { GET } from "./route"

const ANY = `${BACKEND}/api/product-questions/product/*`
const questions = { content: [{ id: "q-1", content: "Latex free?" }], totalElements: 1 }

const authCookie = (token: string) =>
  `auth-storage=${encodeURIComponent(JSON.stringify({ state: { accessToken: token } }))}`

describe("GET /api/product-questions/product/[productId]", () => {
  it("defaults to page 0 / size 10 and forwards the product id", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(questions)
      }),
    )

    const response = await GET(routeRequest("/api/product-questions/product/p-1"), routeParams({ productId: "p-1" }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(questions)

    const url = new URL(captured.url ?? "")
    expect(url.pathname).toBe("/api/product-questions/product/p-1")
    expect(url.searchParams.get("page")).toBe("0")
    expect(url.searchParams.get("size")).toBe("10")
  })

  it("forwards caller-supplied pagination", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(questions)
      }),
    )

    await GET(routeRequest("/api/product-questions/product/p-1?page=4&size=50"), routeParams({ productId: "p-1" }))

    const url = new URL(captured.url ?? "")
    expect(url.searchParams.get("page")).toBe("4")
    expect(url.searchParams.get("size")).toBe("50")
  })

  it("rebuilds the Bearer header from the cookie token, stripping the existing prefix", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(questions)
      }),
    )

    await GET(
      routeRequest("/api/product-questions/product/p-1", { cookie: authCookie("cookie-token") }),
      routeParams({ productId: "p-1" }),
    )

    expect(captured.authorization).toBe("Bearer cookie-token")
  })

  it("forwards an explicit Authorization header unchanged", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(questions)
      }),
    )

    await GET(
      routeRequest("/api/product-questions/product/p-1", { authorization: AUTH }),
      routeParams({ productId: "p-1" }),
    )

    expect(captured.authorization).toBe(AUTH)
  })

  it("stays anonymous and successful without a session", async () => {
    const captured = createCapture()
    server.use(
      http.get(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(questions)
      }),
    )

    const response = await GET(routeRequest("/api/product-questions/product/p-1"), routeParams({ productId: "p-1" }))

    expect(response.status).toBe(200)
    expect(captured.authorization).toBeNull()
  })

  it("encodes the productId before interpolating it into the upstream path, so `../` cannot traverse", async () => {
    const captured = createCapture()
    server.use(
      http.get(`${BACKEND}/*`, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(questions)
      }),
    )

    await GET(routeRequest("/api/product-questions/product/x"), routeParams({ productId: "../users/me" }))

    // FIXED (K8): the segment is encoded before being templated into the upstream path.
    expect(captured.url).toContain("/api/product-questions/product/..%2Fusers%2Fme")
    expect(captured.url).not.toContain("/api/users/me")
  })

  it.each([400, 403, 404, 500])("forwards the backend error payload and status %i", async (status) => {
    server.use(http.get(ANY, () => HttpResponse.json({ message: "no questions" }, { status })))

    const response = await GET(routeRequest("/api/product-questions/product/p-1"), routeParams({ productId: "p-1" }))

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message: "no questions" })
  })

  it("falls back to a generic message when the error body is not JSON", async () => {
    server.use(http.get(ANY, () => HttpResponse.text("<html>", { status: 502 })))

    const response = await GET(routeRequest("/api/product-questions/product/p-1"), routeParams({ productId: "p-1" }))

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ message: "Failed to fetch product questions" })
  })

  it("answers 500 without a stack trace when the backend is unreachable", async () => {
    server.use(http.get(ANY, () => HttpResponse.error()))

    const response = await GET(routeRequest("/api/product-questions/product/p-1"), routeParams({ productId: "p-1" }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ message: "Internal server error" })
  })

  it("exposes GET only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["GET"])
  })
})
