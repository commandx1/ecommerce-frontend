import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { AUTH, BACKEND, createCapture, record, routeParams, routeRequest } from "@/test/route-harness"
import { PUT } from "./route"

/** Resubmit a rejected product for review — multipart update. */

const ANY = `${BACKEND}/api/products/review/*`

function reviewForm(): FormData {
  const form = new FormData()
  form.append("data", JSON.stringify({ name: "Fixed name" }))
  form.append("photos", new File(["a"], "a.png", { type: "image/png" }))
  return form
}

const multipartRequest = (authorization: string | null = AUTH) =>
  routeRequest("/api/products/review/p-1", {
    method: "PUT",
    authorization: authorization ?? undefined,
    body: reviewForm(),
  })

describe("PUT /api/products/review/[id]", () => {
  it("forwards the id in the path and the multipart body with the vendor token", async () => {
    const captured = createCapture()
    let data: string | null = null
    server.use(
      http.put(ANY, async ({ request }) => {
        record(captured, request)
        data = String((await request.formData()).get("data"))
        return HttpResponse.json({ id: "p-1", approved: null })
      }),
    )

    const response = await PUT(multipartRequest(), routeParams({ id: "p-1" }))

    expect(response.status).toBe(200)
    expect(captured.url).toBe(`${BACKEND}/api/products/review/p-1`)
    expect(captured.authorization).toBe(AUTH)
    expect(captured.headers?.get("content-type")).toMatch(/^multipart\/form-data; boundary=/)
    expect(data).toBe(JSON.stringify({ name: "Fixed name" }))
  })

  it("answers 401 without reading the upload when unauthenticated", async () => {
    const captured = createCapture()
    server.use(
      http.put(ANY, ({ request }) => {
        record(captured, request)
        return HttpResponse.json({})
      }),
    )

    const response = await PUT(multipartRequest(null), routeParams({ id: "p-1" }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" })
    expect(captured.count).toBe(0)
  })

  it("encodes the id before building the upstream path, so a `../` segment cannot escape /api/products/review (K8)", async () => {
    const captured = createCapture()
    server.use(
      http.put(`${BACKEND}/*`, async ({ request }) => {
        record(captured, request)
        return HttpResponse.json({})
      }),
    )

    await PUT(multipartRequest(), routeParams({ id: "../users/me" }))

    expect(captured.url).toBe(`${BACKEND}/api/products/review/..%2Fusers%2Fme`)
  })

  it.each([400, 403, 404])("forwards the backend JSON error and status %i", async (status) => {
    server.use(http.put(ANY, () => HttpResponse.json({ message: "rejected" }, { status })))

    const response = await PUT(multipartRequest(), routeParams({ id: "p-1" }))

    expect(response.status).toBe(status)
    await expect(response.json()).resolves.toEqual({ message: "rejected" })
  })

  it("describes a non-JSON error with the upstream status", async () => {
    server.use(http.put(ANY, () => HttpResponse.text("gateway", { status: 502 })))

    const response = await PUT(multipartRequest(), routeParams({ id: "p-1" }))

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ message: "Request failed with status 502", status: 502 })
  })

  it("returns a success envelope when a 2xx carries no JSON", async () => {
    server.use(http.put(ANY, () => HttpResponse.text("", { status: 204 })))

    const response = await PUT(multipartRequest(), routeParams({ id: "p-1" }))

    await expect(response.json()).resolves.toEqual({ success: true })
  })

  it("answers 500 without a stack trace when the backend is unreachable", async () => {
    server.use(http.put(ANY, () => HttpResponse.error()))

    const response = await PUT(multipartRequest(), routeParams({ id: "p-1" }))
    const body = (await response.json()) as { message: string }

    expect(response.status).toBe(500)
    expect(body.message).not.toContain("at ")
  })

  it("exposes PUT only", async () => {
    const route = await import("./route")

    expect(Object.keys(route)).toEqual(["PUT"])
  })
})
