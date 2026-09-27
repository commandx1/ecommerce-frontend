import { NextResponse } from "next/server"
import { describe, expect, it } from "vitest"
import { withPrivateNoStore } from "./server-response-headers"

/**
 * Security-hardening regression: authenticated/personalised GET route handlers under
 * `src/app/api/**` used to return no explicit `Cache-Control`, leaving them at the mercy of
 * whatever proxy/CDN sits in front of the app. `withPrivateNoStore` is the shared wrapper every
 * such handler now uses; these tests pin its contract independent of any one route.
 */
describe("withPrivateNoStore", () => {
  it("adds Cache-Control: private, no-store to the wrapped handler's response", async () => {
    const handler = withPrivateNoStore(async () => NextResponse.json({ ok: true }))

    const response = await handler()

    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
  })

  it("adds Vary: Cookie, Authorization to the wrapped handler's response", async () => {
    const handler = withPrivateNoStore(async () => NextResponse.json({ ok: true }))

    const response = await handler()

    expect(response.headers.get("Vary")).toBe("Cookie, Authorization")
  })

  it("preserves the wrapped handler's status and body", async () => {
    const handler = withPrivateNoStore(async () => NextResponse.json({ message: "Unauthorized" }, { status: 401 }))

    const response = await handler()

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ message: "Unauthorized" })
  })

  it("forwards every argument through to the wrapped handler", async () => {
    let received: unknown[] = []
    const handler = withPrivateNoStore(async (...args: unknown[]) => {
      received = args
      return NextResponse.json({ ok: true })
    })

    await handler("request-stub", { params: Promise.resolve({ id: "p-1" }) })

    expect(received).toEqual(["request-stub", { params: expect.any(Promise) }])
  })

  it("still sets the headers on an error-status response", async () => {
    const handler = withPrivateNoStore(async () => NextResponse.json({ message: "boom" }, { status: 500 }))

    const response = await handler()

    expect(response.headers.get("Cache-Control")).toBe("private, no-store")
    expect(response.status).toBe(500)
  })
})
