import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, jsonRequest, record, routeRequest } from "@/test/route-harness"
import { POST } from "./route"

const UPSTREAM = `${BACKEND}/api/product-questions`
const question = { id: "q-1", content: "Is it latex free?" }

describe("POST /api/product-questions", () => {
  it("forwards the Authorization header and the question body", async () => {
    const captured = createCapture()
    let body: unknown = null
    server.use(
      http.post(UPSTREAM, async ({ request }) => {
        record(captured, request)
        body = await request.json()
        return HttpResponse.json(question)
      }),
    )

    const response = await POST(
      jsonRequest(
        "/api/product-questions",
        { productId: "p-1", content: "Is it latex free?" },
        { authorization: AUTH },
      ),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(question)
    expect(captured.authorization).toBe(AUTH)
    expect(captured.headers?.get("content-type")).toBe("application/json")
    expect(body).toEqual({ productId: "p-1", content: "Is it latex free?" })
  })

  it("omits the Authorization header entirely when the caller has no session", async () => {
    const captured = createCapture()
    server.use(
      http.post(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(question)
      }),
    )

    const response = await POST(jsonRequest("/api/product-questions", { productId: "p-1", content: "x" }))

    // Pinned, not endorsed: the BFF does not gate anonymous question posting.
    expect(captured.count).toBe(1)
    expect(captured.authorization).toBeNull()
    expect(response.status).toBe(200)
  })

  it("does not read the auth-storage cookie, unlike the GET route next to it", async () => {
    const captured = createCapture()
    server.use(
      http.post(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(question)
      }),
    )

    await POST(
      jsonRequest(
        "/api/product-questions",
        { productId: "p-1" },
        { cookie: `auth-storage=${encodeURIComponent(JSON.stringify({ state: { accessToken: "t" } }))}` },
      ),
    )

    expect(captured.authorization).toBeNull()
  })

  it.each([400, 401, 403, 500])(
    "forwards the upstream status %i with a status-coded message when the body is plain text",
    async (status) => {
      server.use(http.post(UPSTREAM, () => HttpResponse.text("Question rejected", { status })))

      const response = await POST(jsonRequest("/api/product-questions", { productId: "p-1" }, { authorization: AUTH }))

      // FIXED (Y12): only a `message` string field from a JSON body is trusted; a plain-text body
      // (which could just as easily be a stack trace) now collapses to a generic message.
      expect(response.status).toBe(status)
      await expect(response.json()).resolves.toEqual({ error: `Request failed with status ${status}` })
    },
  )

  it("forwards a clean JSON `message` field from the upstream error body", async () => {
    server.use(http.post(UPSTREAM, () => HttpResponse.json({ message: "Question is too short" }, { status: 400 })))

    const response = await POST(jsonRequest("/api/product-questions", { productId: "p-1" }, { authorization: AUTH }))

    await expect(response.json()).resolves.toEqual({ error: "Question is too short" })
  })

  it("does not forward a backend stack trace to the browser", async () => {
    const trace = "java.lang.RuntimeException\n\tat com.dentzpro.QuestionService.create(QuestionService.java:10)"
    server.use(http.post(UPSTREAM, () => HttpResponse.text(trace, { status: 500 })))

    const response = await POST(jsonRequest("/api/product-questions", { productId: "p-1" }, { authorization: AUTH }))
    const body = (await response.json()) as { error: string }

    expect(body.error).not.toContain("com.dentzpro")
    expect(body.error).toBe("Request failed with status 500")
  })

  it("uses a generic message when the upstream error body is empty", async () => {
    server.use(http.post(UPSTREAM, () => new HttpResponse(null, { status: 500 })))

    const response = await POST(jsonRequest("/api/product-questions", { productId: "p-1" }, { authorization: AUTH }))

    await expect(response.json()).resolves.toEqual({ error: "Failed to create question" })
  })

  it("answers 500 without a stack trace when the request body is not JSON", async () => {
    const response = await POST(routeRequest("/api/product-questions", { method: "POST", body: "not-json" }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: "Internal server error" })
  })

  it("answers 500 when the backend is unreachable", async () => {
    server.use(http.post(UPSTREAM, () => HttpResponse.error()))

    const response = await POST(jsonRequest("/api/product-questions", { productId: "p-1" }, { authorization: AUTH }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: "Internal server error" })
  })

  it("exposes POST only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["POST"])
  })
})
