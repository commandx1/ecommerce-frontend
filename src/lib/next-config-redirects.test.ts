import { describe, expect, it } from "vitest"
import nextConfig from "../../next.config"

/**
 * Regression guard for the same bug class fixed for /buyer-dashboard in 8f986a1: a legacy route's
 * page.tsx calling redirect() sits under the dashboard's loading.tsx, so it streams to the browser
 * as a SECOND, client-side navigation fired after hydration - and a background tab's hop like that
 * gets judged by the FOCUSED tab's cookie at the proxy, which can steal the shared cookie from the
 * tab the user is actually looking at. Answering these at next.config's redirects() is one request,
 * before the proxy and before any render, so there is nothing to mis-judge.
 */
describe("next.config redirects", () => {
  it("answers the legacy buyer-dashboard vendors/suppliers routes at the edge", async () => {
    const redirects = await nextConfig.redirects?.()

    const expected = [
      { source: "/buyer-dashboard/vendors", destination: "/buyer-dashboard/favorites?tab=vendors" },
      { source: "/buyer-dashboard/vendors/favorites", destination: "/buyer-dashboard/favorites?tab=vendors" },
      { source: "/buyer-dashboard/suppliers", destination: "/buyer-dashboard/favorites?tab=vendors" },
      { source: "/buyer-dashboard/suppliers/favorites", destination: "/buyer-dashboard/favorites?tab=vendors" },
    ]

    for (const { source, destination } of expected) {
      const entry = redirects?.find((r) => r.source === source)
      expect(entry, `expected a redirects() entry for ${source}`).toBeDefined()
      expect(entry?.destination).toBe(destination)
      expect(entry?.permanent).toBe(false)
    }
  })

  it("still answers /buyer-dashboard itself (8f986a1) - not just the four new routes", async () => {
    const redirects = await nextConfig.redirects?.()
    const entry = redirects?.find((r) => r.source === "/buyer-dashboard")

    expect(entry?.destination).toBe("/buyer-dashboard/orders")
    expect(entry?.permanent).toBe(false)
  })
})
