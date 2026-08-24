import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, jsonRequest, record, routeRequest } from "@/test/route-harness"
import { DELETE, PUT } from "./route"

/**
 * `/api/users/me` proxies profile updates and account deletion. Both verbs require an
 * `Authorization` header — and, unlike most other handlers in this tree, they do NOT fall back to
 * the `auth-storage` cookie via `getAuthorizationHeader`. That inconsistency is pinned below.
 */

const UPSTREAM = `${BACKEND}/api/users/me`
const profile = { id: "user-1", email: "buyer@example.com", firstName: "Ada" }

describe("PUT /api/users/me", () => {
  it("forwards the Authorization header and the JSON body, and returns the backend payload", async () => {
    const captured = createCapture()
    let receivedBody: unknown = null
    server.use(
      http.put(UPSTREAM, async ({ request }) => {
        record(captured, request)
        receivedBody = await request.json()
        return HttpResponse.json(profile)
      }),
    )

    const response = await PUT(
      jsonRequest("/api/users/me", { firstName: "Ada" }, { method: "PUT", authorization: AUTH }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(profile)
    expect(captured.authorization).toBe(AUTH)
    expect(captured.headers?.get("content-type")).toBe("application/json")
    expect(receivedBody).toEqual({ firstName: "Ada" })
  })

  it("answers 401 without calling the backend when the Authorization header is missing", async () => {
    const captured = createCapture()
    server.use(
      http.put(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(profile)
      }),
    )

    const response = await PUT(jsonRequest("/api/users/me", { firstName: "Ada" }, { method: "PUT" }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" })
    expect(captured.count).toBe(0)
  })

  it("answers 401 for a request carrying only the auth-storage cookie", async () => {
    const cookie = `auth-storage=${encodeURIComponent(JSON.stringify({ state: { accessToken: "cookie-token" } }))}`

    const response = await PUT(jsonRequest("/api/users/me", { firstName: "Ada" }, { method: "PUT", cookie }))

    // Pinned inconsistency: sibling routes accept this cookie via `getAuthorizationHeader`.
    expect(response.status).toBe(401)
  })

  it.each([400, 403, 404, 409, 500])(
    "forwards the upstream status %i with a status-coded message when the body is plain text",
    async (status) => {
      server.use(http.put(UPSTREAM, () => HttpResponse.text("Validation failed", { status })))

      const response = await PUT(
        jsonRequest("/api/users/me", { firstName: "" }, { method: "PUT", authorization: AUTH }),
      )

      // FIXED (Y12): only a `message` string field from a JSON body is trusted, so this plain-text
      // body — which could just as easily have been a stack trace — collapses to a generic,
      // status-coded message instead of being forwarded verbatim.
      expect(response.status).toBe(status)
      await expect(response.json()).resolves.toEqual({ error: `Request failed with status ${status}` })
    },
  )

  it("forwards a clean JSON `message` field from the upstream error body", async () => {
    server.use(http.put(UPSTREAM, () => HttpResponse.json({ message: "First name is required" }, { status: 400 })))

    const response = await PUT(jsonRequest("/api/users/me", { firstName: "" }, { method: "PUT", authorization: AUTH }))

    await expect(response.json()).resolves.toEqual({ error: "First name is required" })
  })

  it("does not forward a backend stack trace to the browser", async () => {
    const trace = "java.lang.NullPointerException\n\tat com.dentzpro.UserService.update(UserService.java:42)"
    server.use(http.put(UPSTREAM, () => HttpResponse.text(trace, { status: 500 })))

    const response = await PUT(jsonRequest("/api/users/me", {}, { method: "PUT", authorization: AUTH }))
    const body = (await response.json()) as { error: string }

    // FIXED (Y12): the raw upstream body is no longer forwarded verbatim.
    expect(body.error).not.toContain("com.dentzpro")
    expect(body.error).not.toContain("\tat ")
    expect(body.error).toBe("Request failed with status 500")
  })

  it("does not forward a JSON `message` field that itself looks like a stack trace", async () => {
    const trace = "java.lang.NullPointerException\n\tat com.dentzpro.UserService.update(UserService.java:42)"
    server.use(http.put(UPSTREAM, () => HttpResponse.json({ message: trace }, { status: 500 })))

    const response = await PUT(jsonRequest("/api/users/me", {}, { method: "PUT", authorization: AUTH }))

    await expect(response.json()).resolves.toEqual({ error: "Request failed with status 500" })
  })

  it("uses a generic message when the upstream error body is empty", async () => {
    server.use(http.put(UPSTREAM, () => new HttpResponse(null, { status: 500 })))

    const response = await PUT(jsonRequest("/api/users/me", {}, { method: "PUT", authorization: AUTH }))

    await expect(response.json()).resolves.toEqual({ error: "Failed to update user" })
  })

  it("answers 500 without a stack trace when the request body is not JSON", async () => {
    const request = routeRequest("/api/users/me", { method: "PUT", authorization: AUTH, body: "not-json" })

    const response = await PUT(request)

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: "Internal server error" })
  })

  it("answers 500 when the backend is unreachable", async () => {
    server.use(http.put(UPSTREAM, () => HttpResponse.error()))

    const response = await PUT(jsonRequest("/api/users/me", {}, { method: "PUT", authorization: AUTH }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: "Internal server error" })
  })
})

describe("DELETE /api/users/me", () => {
  it("forwards the Authorization header and answers with a success envelope", async () => {
    const captured = createCapture()
    server.use(
      http.delete(UPSTREAM, ({ request }) => {
        record(captured, request)
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const response = await DELETE(routeRequest("/api/users/me", { method: "DELETE", authorization: AUTH }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true })
    expect(captured.authorization).toBe(AUTH)
    expect(captured.method).toBe("DELETE")
  })

  it("discards any body the backend returns on success", async () => {
    server.use(http.delete(UPSTREAM, () => HttpResponse.json({ deletedAt: "2026-01-01", id: "user-1" })))

    const response = await DELETE(routeRequest("/api/users/me", { method: "DELETE", authorization: AUTH }))

    await expect(response.json()).resolves.toEqual({ success: true })
  })

  it("answers 401 without calling the backend when unauthenticated", async () => {
    const captured = createCapture()
    server.use(
      http.delete(UPSTREAM, ({ request }) => {
        record(captured, request)
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const response = await DELETE(routeRequest("/api/users/me", { method: "DELETE" }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" })
    expect(captured.count).toBe(0)
  })

  it.each([403, 404, 409, 500])(
    "forwards the upstream status %i with a status-coded message when the body is plain text",
    async (status) => {
      server.use(http.delete(UPSTREAM, () => HttpResponse.text("cannot delete", { status })))

      const response = await DELETE(routeRequest("/api/users/me", { method: "DELETE", authorization: AUTH }))

      // FIXED (Y12): see the PUT suite above for why plain-text bodies are no longer forwarded.
      expect(response.status).toBe(status)
      await expect(response.json()).resolves.toEqual({ error: `Request failed with status ${status}` })
    },
  )

  it("answers 500 when the backend is unreachable", async () => {
    server.use(http.delete(UPSTREAM, () => HttpResponse.error()))

    const response = await DELETE(routeRequest("/api/users/me", { method: "DELETE", authorization: AUTH }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: "Internal server error" })
  })
})

describe("/api/users/me route surface", () => {
  it("exposes PUT and DELETE only — GET and POST are framework 405s", async () => {
    const route = await import("./route")

    expect(Object.keys(route).sort()).toEqual(["DELETE", "PUT"])
  })
})
