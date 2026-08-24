import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, record, routeRequest } from "@/test/route-harness"
import { POST } from "./route"

/** Vendor "submit product for review" flow — multipart, same shape as POST /api/products. */

const UPSTREAM = `${BACKEND}/api/products/review`

function reviewForm(): FormData {
  const form = new FormData()
  form.append("data", JSON.stringify({ name: "Composite Kit" }))
  form.append("coverPhoto", new File(["cover"], "cover.png", { type: "image/png" }))
  form.append("photos", new File(["a"], "a.png", { type: "image/png" }))
  return form
}

const multipartRequest = (authorization: string | null = AUTH) =>
  routeRequest("/api/products/review", {
    method: "POST",
    authorization: authorization ?? undefined,
    body: reviewForm(),
  })

describe("POST /api/products/review", () => {
  it("forwards the multipart payload to the review endpoint with the vendor token", async () => {
    const captured = createCapture()
    let names: string[] = []
    server.use(
      http.post(UPSTREAM, async ({ request }) => {
        record(captured, request)
        names = [...(await request.formData()).keys()]
        return HttpResponse.json({ id: "p-1", approved: null })
      }),
    )

    const response = await POST(multipartRequest())

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ id: "p-1", approved: null })
    expect(captured.url).toBe(UPSTREAM)
    expect(captured.authorization).toBe(AUTH)
    expect(captured.headers?.get("content-type")).toMatch(/^multipart\/form-data; boundary=/)
    expect(names).toEqual(["data", "coverPhoto", "photos"])
  })

  it("answers 401 without reading the upload when unauthenticated", async () => {
    const captured = createCapture()
    server.use(
      http.post(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json({})
      }),
    )

    const response = await POST(multipartRequest(null))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" })
    expect(captured.count).toBe(0)
  })

  it.each([400, 403, 413])("forwards the backend JSON error and status %i", async (status) => {
    server.use(http.post(UPSTREAM, () => HttpResponse.json({ message: "rejected" }, { status })))

    const response = await POST(multipartRequest())

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message: "rejected" })
  })

  it("returns a success envelope when a 2xx carries no JSON", async () => {
    server.use(http.post(UPSTREAM, () => HttpResponse.text("", { status: 201 })))

    const response = await POST(multipartRequest())

    await expect(response.json()).resolves.toEqual({ success: true })
  })

  it("answers 500 without a stack trace when the backend is unreachable", async () => {
    server.use(http.post(UPSTREAM, () => HttpResponse.error()))

    const response = await POST(multipartRequest())
    const body = (await response.json()) as { message: string }

    expect(response.status).toBe(500)
    expect(body.message).not.toContain("at ")
  })

  it("exposes POST only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["POST"])
  })
})
