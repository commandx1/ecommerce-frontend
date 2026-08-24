import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, record, routeRequest } from "@/test/route-harness"
import { POST } from "./route"

/**
 * Product creation is the only multipart flow in the BFF: `data` (JSON string) + `coverPhoto` +
 * repeated `photos` entries. The handler must NOT set Content-Type itself — `fetch` has to
 * generate the multipart boundary — so that is asserted directly on the upstream request.
 *
 * (Multipart round-trips through MSW hang under jsdom; they work in this `node` project, which is
 * one of the reasons the server suites were split out.)
 */

const UPSTREAM = `${BACKEND}/api/products`

function productForm(): FormData {
  const form = new FormData()
  form.append("data", JSON.stringify({ name: "Composite Kit", brand: "MARK3" }))
  form.append("coverPhoto", new File(["cover-bytes"], "cover.png", { type: "image/png" }))
  form.append("photos", new File(["a"], "a.png", { type: "image/png" }))
  form.append("photos", new File(["b"], "b.png", { type: "image/png" }))
  return form
}

const multipartRequest = (body: FormData, authorization: string | null = AUTH) =>
  routeRequest("/api/products", { method: "POST", authorization: authorization ?? undefined, body })

describe("POST /api/products", () => {
  it("streams every multipart field through and lets fetch own the boundary", async () => {
    const captured = createCapture()
    let fields: Record<string, string[]> = {}
    server.use(
      http.post(UPSTREAM, async ({ request }) => {
        record(captured, request)
        const form = await request.formData()
        fields = {
          data: form.getAll("data").map(String),
          coverPhoto: form.getAll("coverPhoto").map((f) => (f as File).name),
          photos: form.getAll("photos").map((f) => (f as File).name),
        }
        return HttpResponse.json({ id: "p-1" })
      }),
    )

    const response = await POST(multipartRequest(productForm()))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ id: "p-1" })
    expect(captured.authorization).toBe(AUTH)
    expect(captured.headers?.get("content-type")).toMatch(/^multipart\/form-data; boundary=/)
    expect(fields.data).toEqual([JSON.stringify({ name: "Composite Kit", brand: "MARK3" })])
    expect(fields.coverPhoto).toEqual(["cover.png"])
    // Repeated `photos` entries must survive as a list, not collapse to the last one.
    expect(fields.photos).toEqual(["a.png", "b.png"])
  })

  it("answers 401 without reading the upload when unauthenticated", async () => {
    const captured = createCapture()
    server.use(
      http.post(UPSTREAM, ({ request }) => {
        record(captured, request)
        return HttpResponse.json({ id: "p-1" })
      }),
    )

    const response = await POST(multipartRequest(productForm(), null))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" })
    expect(captured.count).toBe(0)
  })

  it.each([400, 403, 413, 500])("forwards the backend JSON error and status %i", async (status) => {
    server.use(http.post(UPSTREAM, () => HttpResponse.json({ message: "upload rejected" }, { status })))

    const response = await POST(multipartRequest(productForm()))

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message: "upload rejected" })
  })

  it("describes a non-JSON error with the upstream status", async () => {
    server.use(http.post(UPSTREAM, () => HttpResponse.text("413 Request Entity Too Large", { status: 413 })))

    const response = await POST(multipartRequest(productForm()))

    expect(response.status).toBe(413)
    await expect(response.json()).resolves.toEqual({ message: "Request failed with status 413", status: 413 })
  })

  it("returns a success envelope when a 2xx carries no JSON", async () => {
    server.use(http.post(UPSTREAM, () => HttpResponse.text("", { status: 201 })))

    const response = await POST(multipartRequest(productForm()))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true })
  })

  it("answers 500 without a stack trace when the request is not multipart at all", async () => {
    const response = await POST(
      routeRequest("/api/products", {
        method: "POST",
        authorization: AUTH,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "x" }),
      }),
    )

    expect(response.status).toBe(500)
    const body = (await response.json()) as { message: string }
    expect(body.message).not.toContain("at ")
  })

  it("answers 500 when the backend is unreachable", async () => {
    server.use(http.post(UPSTREAM, () => HttpResponse.error()))

    const response = await POST(multipartRequest(productForm()))

    expect(response.status).toBe(500)
  })

  it("exposes POST only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["POST"])
  })
})
