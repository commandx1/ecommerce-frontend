import { NextRequest } from "next/server"
import { describe, expect, it } from "vitest"
import { getAuthorizationHeader } from "./server-auth"

/**
 * Route handlers call `getAuthorizationHeader` to forward the caller's identity to the backend.
 * The token can arrive either as a real `Authorization` header (server-to-server calls) or inside
 * the `auth-storage` cookie the Zustand persist middleware writes from the browser.
 */
function makeRequest(options: { authorization?: string; cookie?: string } = {}): NextRequest {
  const headers = new Headers()
  if (options.authorization) headers.set("Authorization", options.authorization)
  if (options.cookie) headers.set("cookie", options.cookie)
  return new NextRequest("http://localhost:3000/api/cart", { headers })
}

const authStorage = (state: Record<string, unknown>) => JSON.stringify({ state, version: 0 })

describe("getAuthorizationHeader contract", () => {
  it("returns the Authorization header verbatim when present", () => {
    const request = makeRequest({ authorization: "Bearer header-token" })

    expect(getAuthorizationHeader(request)).toBe("Bearer header-token")
  })

  it("prefers the header over the cookie when both are present", () => {
    const request = makeRequest({
      authorization: "Bearer header-token",
      cookie: `auth-storage=${authStorage({ accessToken: "cookie-token" })}`,
    })

    expect(getAuthorizationHeader(request)).toBe("Bearer header-token")
  })

  it("builds the Bearer header from a plain JSON auth-storage cookie", () => {
    const request = makeRequest({ cookie: `auth-storage=${authStorage({ accessToken: "cookie-token" })}` })

    expect(getAuthorizationHeader(request)).toBe("Bearer cookie-token")
  })

  it("builds the Bearer header from a percent-encoded auth-storage cookie", () => {
    const encoded = encodeURIComponent(authStorage({ accessToken: "encoded-token", isAuthenticated: true }))
    const request = makeRequest({ cookie: `auth-storage=${encoded}` })

    expect(getAuthorizationHeader(request)).toBe("Bearer encoded-token")
  })

  it("returns null when neither the header nor the cookie is present", () => {
    expect(getAuthorizationHeader(makeRequest())).toBeNull()
  })

  it("returns null for a cookie that is not valid JSON in either encoding", () => {
    expect(getAuthorizationHeader(makeRequest({ cookie: "auth-storage=not-json" }))).toBeNull()
  })

  it("returns null when the persisted state carries no access token", () => {
    expect(getAuthorizationHeader(makeRequest({ cookie: `auth-storage=${authStorage({})}` }))).toBeNull()
    expect(
      getAuthorizationHeader(makeRequest({ cookie: `auth-storage=${authStorage({ accessToken: null })}` })),
    ).toBeNull()
    expect(
      getAuthorizationHeader(makeRequest({ cookie: `auth-storage=${authStorage({ accessToken: "" })}` })),
    ).toBeNull()
    expect(getAuthorizationHeader(makeRequest({ cookie: `auth-storage=${JSON.stringify({})}` }))).toBeNull()
  })

  it("ignores unrelated cookies", () => {
    const request = makeRequest({ cookie: "other=1; session=abc" })

    expect(getAuthorizationHeader(request)).toBeNull()
  })

  it("does not prepend Bearer twice when the header already carries the scheme", () => {
    // Pinned as-is: the header path is a pass-through, so a caller sending a bare token
    // forwards a bare token — the backend, not this helper, decides whether that is valid.
    expect(getAuthorizationHeader(makeRequest({ authorization: "raw-token" }))).toBe("raw-token")
  })
})
