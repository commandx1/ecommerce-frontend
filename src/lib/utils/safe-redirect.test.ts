import { describe, expect, it } from "vitest"
import { safeRedirect } from "./safe-redirect"

describe("safeRedirect", () => {
  it("falls back to / for null", () => {
    expect(safeRedirect(null)).toBe("/")
  })

  it("falls back to / for undefined", () => {
    expect(safeRedirect(undefined)).toBe("/")
  })

  it("falls back to / for an empty string", () => {
    expect(safeRedirect("")).toBe("/")
  })

  it("falls back to / for an absolute external URL", () => {
    expect(safeRedirect("https://evil.com")).toBe("/")
  })

  it("falls back to / for a protocol-relative URL", () => {
    expect(safeRedirect("//evil.com")).toBe("/")
  })

  it("falls back to / for a backslash trick", () => {
    expect(safeRedirect("/\\evil.com")).toBe("/")
  })

  // Browsers strip tab/CR/LF while parsing a URL, so these resolve to "//evil.com" - an open
  // redirect that was reproduced live through the login page's redirect before this guard.
  it.each([
    ["tab", "/\t/evil.com"],
    ["newline", "/\n/evil.com"],
    ["carriage return", "/\r/evil.com"],
    ["tab before a backslash", "/\t\\evil.com"],
  ])("falls back to / when a %s smuggles in an external host", (_label, value) => {
    expect(safeRedirect(value)).toBe("/")
  })

  it.each(["javascript:alert(1)", "products", "http://safe-redirect.invalid.evil.com/x"])(
    "falls back to / for the non-path value %s",
    (value) => {
      expect(safeRedirect(value)).toBe("/")
    },
  )

  it("falls back to / when dot segments resolve onto /login", () => {
    expect(safeRedirect("/products/../login")).toBe("/")
  })

  it("keeps an encoded query and a hash intact", () => {
    expect(safeRedirect("/products?category=Disposables%2CGloves&search=a%20b#reviews")).toBe(
      "/products?category=Disposables%2CGloves&search=a%20b#reviews",
    )
  })

  it("falls back to / for /login", () => {
    expect(safeRedirect("/login")).toBe("/")
  })

  it("falls back to / for /login with a query string", () => {
    expect(safeRedirect("/login?x=1")).toBe("/")
  })

  it("returns a valid same-origin relative path unchanged", () => {
    expect(safeRedirect("/products/abc?vendorId=1")).toBe("/products/abc?vendorId=1")
  })

  it("returns / unchanged", () => {
    expect(safeRedirect("/")).toBe("/")
  })

  it("returns a notification-link orderId redirect unchanged", () => {
    const path = "/buyer-dashboard/orders?orderId=11111111-1111-1111-1111-111111111111"
    expect(safeRedirect(path)).toBe(path)
  })
})
