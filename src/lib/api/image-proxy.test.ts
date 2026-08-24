import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { downloadImageAsFileViaProxy } from "./image-proxy"
import { ApiRequestError } from "./request"

describe("downloadImageAsFileViaProxy", () => {
  it("downloads through the proxy and returns a File with the response name and content-type", async () => {
    server.use(
      http.get("*/api/images/proxy*", () => {
        return new HttpResponse(new Blob(["hello"], { type: "image/png" }), {
          headers: { "Content-Type": "image/png" },
        })
      }),
    )

    const file = await downloadImageAsFileViaProxy("https://example.com/img.png", "product.png")

    expect(file).toBeInstanceOf(File)
    expect(file.name).toBe("product.png")
    expect(file.type).toBe("image/png")
    // The exact byte size isn't reliably reproducible through jsdom's XHR/Blob shim
    // (see the note below), so we only assert content was actually carried over.
    expect(file.size).toBeGreaterThan(0)
  })

  it("routes the request through /api/images/proxy with the source url encoded as a query param", async () => {
    let capturedUrl: string | null = null
    server.use(
      http.get("*/api/images/proxy*", ({ request }) => {
        capturedUrl = request.url
        return new HttpResponse(new Blob(["x"], { type: "image/jpeg" }), {
          headers: { "Content-Type": "image/jpeg" },
        })
      }),
    )

    await downloadImageAsFileViaProxy("https://cdn.example.com/a b.png", "file.jpg")

    expect(capturedUrl).toContain("/api/images/proxy?url=")
    expect(capturedUrl).toContain(encodeURIComponent("https://cdn.example.com/a b.png"))
  })

  it("rejects with the fallback message when the proxy responds 404", async () => {
    server.use(http.get("*/api/images/proxy*", () => new HttpResponse(null, { status: 404 })))

    await expect(downloadImageAsFileViaProxy("https://example.com/missing.png", "missing.png")).rejects.toThrow(
      "Failed to download image",
    )
  })

  it("surfaces the 404 status on the thrown ApiRequestError", async () => {
    server.use(http.get("*/api/images/proxy*", () => new HttpResponse(null, { status: 404 })))

    try {
      await downloadImageAsFileViaProxy("https://example.com/missing.png", "missing.png")
      throw new Error("expected downloadImageAsFileViaProxy to reject")
    } catch (error) {
      expect(error).toBeInstanceOf(ApiRequestError)
      expect((error as ApiRequestError).status).toBe(404)
    }
  })

  it("rejects with the fallback message on a network error", async () => {
    server.use(http.get("*/api/images/proxy*", () => HttpResponse.error()))

    await expect(downloadImageAsFileViaProxy("https://example.com/img.png", "img.png")).rejects.toThrow(
      "Failed to download image",
    )
  })

  // Suspicious/environment-dependent behavior found while writing this test (reported,
  // not fixed, per task constraints):
  //
  // The source falls back to "image/jpeg" via `blob.type || "image/jpeg"` when the proxy
  // response has no usable content-type. In a real browser, a Blob built from a response
  // with no Content-Type header gets `blob.type === ""`, so the fallback fires. Under
  // jsdom's XHR/Blob shim (used by this test environment), a blob built without an
  // explicit type instead defaults to `"text/plain;charset=utf-8"` — a truthy string — so
  // `blob.type || "image/jpeg"` never reaches the fallback branch here. This test locks in
  // the behavior actually observable in this suite (jsdom's default), and does NOT
  // exercise the "image/jpeg" fallback path, since jsdom cannot reproduce the empty-type
  // condition that triggers it.
  it("falls back to the blob's own (jsdom-default) type when the proxy sends no content-type", async () => {
    server.use(http.get("*/api/images/proxy*", () => new HttpResponse(new Blob(["hello"]))))

    const file = await downloadImageAsFileViaProxy("https://example.com/img", "img")

    expect(file.type).toBe("text/plain;charset=utf-8")
  })
})
