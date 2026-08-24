import { describe, expect, it } from "vitest"
import { resolveSelectedUserProductId } from "./selectedVendor"

describe("resolveSelectedUserProductId", () => {
  it("returns undefined when there is no vendorId in the URL", () => {
    expect(resolveSelectedUserProductId(null, [{ id: "up-1" }])).toBeUndefined()
  })

  it("returns undefined when the supplier list is empty, even with a vendorId", () => {
    expect(resolveSelectedUserProductId("up-1", [])).toBeUndefined()
  })

  it("returns the vendorId when it matches a single supplier's id", () => {
    expect(resolveSelectedUserProductId("up-1", [{ id: "up-1" }])).toBe("up-1")
  })

  it("returns undefined when the vendorId does not match any supplier's id (stale URL)", () => {
    expect(resolveSelectedUserProductId("up-stale", [{ id: "up-1" }, { id: "up-2" }])).toBeUndefined()
  })

  it("returns the vendorId when it matches one of several suppliers", () => {
    expect(resolveSelectedUserProductId("up-2", [{ id: "up-1" }, { id: "up-2" }, { id: "up-3" }])).toBe("up-2")
  })
})
