import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, jsonRequest, record, routeRequest } from "@/test/route-harness"
import { POST } from "./route"

const UPSTREAM = `${BACKEND}/api/product-answers`
const answer = { id: "a-1", content: "Yes, latex free." }

describe("POST /api/product-answers", () => {
  it("forwards the Authorization header and the answer body", async () => {
    const captured = createCapture()
    let body: unknown = null
    server.use(
      http.post(UPSTREAM, async ({ request }) => {
        record(captured, request)
        body = await request.json()
        return HttpResponse.json(answer)
      }),
    )

    const response = await POST(
      jsonRequest("/api/product-answers", { questionId: "q-1", content: "Yes, latex free." }, { authorization: AUTH }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(answer)
    expect(captured.authorization).toBe(AUTH)
    expect(body).toEqual({ questionId: "q-1", content: "Yes, latex free." })
  })

  it("calls the backend anonymously when the caller has no session", async () => {
    const captured = createCapture()
    server.use(
      http.post(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json(answer)
      }),
    )

    const response = await POST(jsonRequest("/api/product-answers", { questionId: "q-1", content: "x" }))

    // Pinned, not endorsed: only the vendor who owns the product should be able to answer,
    // and the BFF makes no such check.
    expect(captured.count).toBe(1)
    expect(captured.authorization).toBeNull()
    expect(response.status).toBe(200)
  })

  it.each([400, 401, 403, 500])(
    "forwards the upstream status %i with a status-coded message when the body is plain text",
    async (status) => {
      server.use(http.post(UPSTREAM, () => HttpResponse.text("Answer rejected", { status })))

      const response = await POST(jsonRequest("/api/product-answers", { questionId: "q-1" }, { authorization: AUTH }))

      // FIXED (Y12): only a `message` string field from a JSON body is trusted; a plain-text body
      // (which could just as easily be a stack trace) now collapses to a generic message.
      expect(response.status).toBe(status)
      await expect(response.json()).resolves.toEqual({ error: `Request failed with status ${status}` })
    },
  )

  it("forwards a clean JSON `message` field from the upstream error body", async () => {
    server.use(http.post(UPSTREAM, () => HttpResponse.json({ message: "Answer is too short" }, { status: 400 })))

    const response = await POST(jsonRequest("/api/product-answers", { questionId: "q-1" }, { authorization: AUTH }))

    await expect(response.json()).resolves.toEqual({ error: "Answer is too short" })
  })

  it("does not forward a backend stack trace to the browser", async () => {
    const trace = "java.lang.RuntimeException\n\tat com.dentzpro.AnswerService.create(AnswerService.java:10)"
    server.use(http.post(UPSTREAM, () => HttpResponse.text(trace, { status: 500 })))

    const response = await POST(jsonRequest("/api/product-answers", { questionId: "q-1" }, { authorization: AUTH }))
    const body = (await response.json()) as { error: string }

    expect(body.error).not.toContain("com.dentzpro")
    expect(body.error).toBe("Request failed with status 500")
  })

  it("uses a generic message when the upstream error body is empty", async () => {
    server.use(http.post(UPSTREAM, () => new HttpResponse(null, { status: 502 })))

    const response = await POST(jsonRequest("/api/product-answers", { questionId: "q-1" }, { authorization: AUTH }))

    await expect(response.json()).resolves.toEqual({ error: "Failed to create answer" })
  })

  it("answers 500 without a stack trace when the request body is not JSON", async () => {
    const response = await POST(routeRequest("/api/product-answers", { method: "POST", body: "not-json" }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: "Internal server error" })
  })

  it("answers 500 when the backend is unreachable", async () => {
    server.use(http.post(UPSTREAM, () => HttpResponse.error()))

    const response = await POST(jsonRequest("/api/product-answers", { questionId: "q-1" }, { authorization: AUTH }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: "Internal server error" })
  })

  it("exposes POST only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["POST"])
  })
})
