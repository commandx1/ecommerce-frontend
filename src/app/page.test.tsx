import { describe, expect, it } from "vitest"

/**
 * `export const revalidate = 900` was a no-op on this page: the root layout reads `cookies()` on
 * every request, which forces the whole route tree dynamic regardless of a page-level
 * `revalidate` segment config, so the home page was never actually served from an ISR cache at
 * that TTL. Removed in the caching audit; pinned here so it doesn't get re-added by copy-paste
 * from a sibling page.
 */
describe("Home page", () => {
  it("does not export a segment-level `revalidate` (would be a no-op under the dynamic root layout)", async () => {
    const pageModule = await import("./page")

    expect(pageModule).not.toHaveProperty("revalidate")
  })
})
