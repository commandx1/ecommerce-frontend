import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, jsonRequest, record, routeParams, routeRequest } from "@/test/route-harness"
import { DELETE, PUT } from "./route"

const upstream = (id: string) => `${BACKEND}/api/reviews/${id}`
const ANY = `${BACKEND}/api/reviews/:id`

describe("PUT /api/reviews/[id]", () => {
  it("forwards the id in the path plus the Authorization header and body", async () => {
    const captured = createCapture()
    let body: unknown = null
    server.use(
      http.put(ANY, async ({ request }) => {
        record(captured, request)
        body = await request.json()
        return HttpResponse.json({ id: "rev-1", rating: 4 })
      }),
    )

    const response = await PUT(
      jsonRequest("/api/reviews/rev-1", { rating: 4 }, { method: "PUT", authorization: AUTH }),
      routeParams({ id: "rev-1" }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ id: "rev-1", rating: 4 })
    expect(captured.url).toBe(upstream("rev-1"))
    expect(captured.authorization).toBe(AUTH)
    expect(body).toEqual({ rating: 4 })
  })

  it("encodes the id before interpolating it into the upstream path, so `../` cannot traverse", async () => {
    const captured = createCapture()
    server.use(
      http.put(`${BACKEND}/*`, ({ request }) => {
        record(captured, request)
        return HttpResponse.json({})
      }),
    )

    await PUT(
      jsonRequest("/api/reviews/x", { rating: 4 }, { method: "PUT", authorization: AUTH }),
      routeParams({ id: "../users/me" }),
    )

    // FIXED (K8): `encodeURIComponent(id)` keeps the segment literal, so `fetch` can no longer
    // collapse it into a different backend endpoint. Next hands this handler a DECODED segment
    // (`/api/reviews/..%2Fusers%2Fme` arrives as `../users/me`), so the route must re-encode it.
    expect(captured.url).toBe(`${BACKEND}/api/reviews/..%2Fusers%2Fme`)
  })

  it("calls the backend even without an Authorization header", async () => {
    const captured = createCapture()
    server.use(
      http.put(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json({})
      }),
    )

    await PUT(jsonRequest("/api/reviews/rev-1", { rating: 1 }, { method: "PUT" }), routeParams({ id: "rev-1" }))

    expect(captured.count).toBe(1)
    expect(captured.authorization).toBeNull()
  })

  it.each([400, 403, 404, 500])("forwards the backend error payload and status %i", async (status) => {
    server.use(http.put(ANY, () => HttpResponse.json({ message: "Not your review" }, { status })))

    const response = await PUT(
      jsonRequest("/api/reviews/rev-1", { rating: 4 }, { method: "PUT", authorization: AUTH }),
      routeParams({ id: "rev-1" }),
    )

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message: "Not your review" })
  })

  it("falls back to a generic message when the error body is not JSON", async () => {
    server.use(http.put(ANY, () => HttpResponse.text("boom", { status: 500 })))

    const response = await PUT(
      jsonRequest("/api/reviews/rev-1", { rating: 4 }, { method: "PUT", authorization: AUTH }),
      routeParams({ id: "rev-1" }),
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ message: "Failed to update review" })
  })

  it("answers 500 when the body is not JSON", async () => {
    const response = await PUT(
      routeRequest("/api/reviews/rev-1", { method: "PUT", authorization: AUTH, body: "nope" }),
      routeParams({ id: "rev-1" }),
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: "Internal server error" })
  })
})

describe("DELETE /api/reviews/[id]", () => {
  it("answers 204 with no body when the backend deletes the review", async () => {
    const captured = createCapture()
    server.use(
      http.delete(ANY, ({ request }) => {
        record(captured, request)
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const response = await DELETE(
      routeRequest("/api/reviews/rev-1", { method: "DELETE", authorization: AUTH }),
      routeParams({ id: "rev-1" }),
    )

    expect(response.status).toBe(204)
    await expect(response.text()).resolves.toBe("")
    expect(captured.url).toBe(upstream("rev-1"))
    expect(captured.authorization).toBe(AUTH)
  })

  it.each([403, 404, 500])("forwards the backend error payload and status %i", async (status) => {
    server.use(http.delete(ANY, () => HttpResponse.json({ message: "Not allowed" }, { status })))

    const response = await DELETE(
      routeRequest("/api/reviews/rev-1", { method: "DELETE", authorization: AUTH }),
      routeParams({ id: "rev-1" }),
    )

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message: "Not allowed" })
  })

  it("falls back to a generic message when the error body is not JSON", async () => {
    server.use(http.delete(ANY, () => HttpResponse.text("boom", { status: 502 })))

    const response = await DELETE(
      routeRequest("/api/reviews/rev-1", { method: "DELETE", authorization: AUTH }),
      routeParams({ id: "rev-1" }),
    )

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ message: "Failed to delete review" })
  })

  it("answers 500 when the backend is unreachable", async () => {
    server.use(http.delete(ANY, () => HttpResponse.error()))

    const response = await DELETE(
      routeRequest("/api/reviews/rev-1", { method: "DELETE", authorization: AUTH }),
      routeParams({ id: "rev-1" }),
    )

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: "Internal server error" })
  })

  it("encodes the id before interpolating it into the upstream path, so `../` cannot traverse", async () => {
    const captured = createCapture()
    server.use(
      http.delete(`${BACKEND}/*`, ({ request }) => {
        record(captured, request)
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await DELETE(
      routeRequest("/api/reviews/x", { method: "DELETE", authorization: AUTH }),
      routeParams({ id: "../users/me" }),
    )

    expect(captured.url).toBe(`${BACKEND}/api/reviews/..%2Fusers%2Fme`)
  })
})

describe("/api/reviews/[id] route surface", () => {
  it("exposes PUT and DELETE only", async () => {
    const route = await import("./route")

    expect(Object.keys(route).sort()).toEqual(["DELETE", "PUT"])
  })
})
