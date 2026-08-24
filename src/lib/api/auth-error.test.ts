import { describe, expect, it } from "vitest"
import { extractErrorStatus, isAuthErrorStatus, isAuthHandledError, isJwtExpired } from "./auth-error"

describe("extractErrorStatus", () => {
  it("reads the status off an axios-error-shaped object (response.status)", () => {
    expect(extractErrorStatus({ response: { status: 401 } })).toBe(401)
  })

  it("reads a top-level status when response.status is absent", () => {
    expect(extractErrorStatus({ status: 500 })).toBe(500)
  })

  it("prefers response.status over a top-level status", () => {
    expect(extractErrorStatus({ status: 500, response: { status: 403 } })).toBe(403)
  })

  it("reads the status off a fetch Response object", () => {
    const response = new Response(null, { status: 404 })
    expect(extractErrorStatus(response)).toBe(404)
  })

  it("returns undefined for a plain object with no status", () => {
    expect(extractErrorStatus({ message: "oops" })).toBeUndefined()
  })

  it("returns undefined for undefined", () => {
    expect(extractErrorStatus(undefined)).toBeUndefined()
  })

  it("returns undefined for null", () => {
    expect(extractErrorStatus(null)).toBeUndefined()
  })

  it("returns undefined for a non-object value", () => {
    expect(extractErrorStatus("just a string")).toBeUndefined()
  })
})

describe("isAuthErrorStatus", () => {
  it("returns true for 401", () => {
    expect(isAuthErrorStatus(401)).toBe(true)
  })

  // 403 is a business-rule/authorization rejection on an otherwise-authenticated
  // session (missing role, unapproved account), not an expired-session signal —
  // per the source's own comment, it must NOT be treated as an auth error here.
  it("returns false for 403 (authorization rejection, not session expiry)", () => {
    expect(isAuthErrorStatus(403)).toBe(false)
  })

  it("returns false for 400", () => {
    expect(isAuthErrorStatus(400)).toBe(false)
  })

  it("returns false for 404", () => {
    expect(isAuthErrorStatus(404)).toBe(false)
  })

  it("returns false for 500", () => {
    expect(isAuthErrorStatus(500)).toBe(false)
  })

  it("returns false for undefined", () => {
    expect(isAuthErrorStatus(undefined)).toBe(false)
  })
})

describe("isAuthHandledError", () => {
  // `authHandled` is the flag client.ts's response interceptor sets on the axios
  // error object after it has already run the 401 logout flow, so downstream
  // callers know not to react to the error a second time.
  it("returns true when the authHandled flag set by client.ts's interceptor is present", () => {
    expect(isAuthHandledError({ authHandled: true })).toBe(true)
  })

  it("returns false when authHandled is explicitly false", () => {
    expect(isAuthHandledError({ authHandled: false })).toBe(false)
  })

  it("returns false when the authHandled flag is absent", () => {
    expect(isAuthHandledError({ response: { status: 401 } })).toBe(false)
  })

  it("returns false for undefined", () => {
    expect(isAuthHandledError(undefined)).toBe(false)
  })

  it("returns false for null", () => {
    expect(isAuthHandledError(null)).toBe(false)
  })

  it("returns false for a non-object value", () => {
    expect(isAuthHandledError("error")).toBe(false)
  })
})

describe("isJwtExpired", () => {
  const NOW = Date.UTC(2026, 0, 2, 12, 0, 0)

  /** Builds an unsigned, base64url-encoded JWT — only the payload is ever read. */
  const jwtWithClaims = (claims: Record<string, unknown>): string => {
    const encode = (value: object): string =>
      btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
    return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(claims)}.signature-not-verified-here`
  }

  it("returns true for a token whose exp is in the past", () => {
    expect(isJwtExpired(jwtWithClaims({ exp: NOW / 1000 - 3600 }), NOW)).toBe(true)
  })

  it("returns true at the exact expiry instant", () => {
    expect(isJwtExpired(jwtWithClaims({ exp: NOW / 1000 }), NOW)).toBe(true)
  })

  it("returns false for a token that is still valid", () => {
    expect(isJwtExpired(jwtWithClaims({ exp: NOW / 1000 + 3600 }), NOW)).toBe(false)
  })

  // Everything below must stay false: an unreadable token is never grounds for a logout
  // on its own, it just falls back to the plain 401-only behaviour.
  it("returns false when the payload carries no exp claim", () => {
    expect(isJwtExpired(jwtWithClaims({ sub: "buyer@example.com" }), NOW)).toBe(false)
  })

  it("returns false when exp is not a number", () => {
    expect(isJwtExpired(jwtWithClaims({ exp: "1767355200" }), NOW)).toBe(false)
  })

  it("returns false for a string that is not a JWT", () => {
    expect(isJwtExpired("opaque-session-token", NOW)).toBe(false)
  })

  it("returns false when the payload segment is not valid base64 JSON", () => {
    expect(isJwtExpired("header.@@@not-base64@@@.signature", NOW)).toBe(false)
  })

  it("returns false for null", () => {
    expect(isJwtExpired(null, NOW)).toBe(false)
  })

  it("returns false for undefined", () => {
    expect(isJwtExpired(undefined, NOW)).toBe(false)
  })

  it("returns false for an empty string", () => {
    expect(isJwtExpired("", NOW)).toBe(false)
  })
})
