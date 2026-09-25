import { describe, expect, it } from "vitest"
import nextConfig from "../../next.config"

/**
 * Regression guard for K15: on the self-hosted standalone server `/_next/image` must never be
 * emitted (a custom loader disables that route and external CDNs 403 the optimizer anyway), so
 * next/image has to hand every `src` to the browser unchanged. `unoptimized: true` guarantees
 * that without a pass-through loader, which next/image flags as "does not implement width".
 */
describe("next.config images", () => {
  it("serves images unoptimized, without a custom loader", () => {
    expect(nextConfig.images?.unoptimized).toBe(true)
    expect(nextConfig.images?.loader).toBeUndefined()
    expect(nextConfig.images?.loaderFile).toBeUndefined()
  })
})
