import type { ReactElement } from "react"
import FilterNavigationProvider from "@/features/products/listing/components/listing/FilterNavigationProvider"
import { type RenderWithProvidersResult, render } from "@/test/render"

/**
 * Every product-listing filter reads and writes the URL through `FilterNavigationProvider`, and
 * throws when rendered without it. This mounts the component under test inside a real provider
 * bound to `searchParams`, so a test can drive a control and assert on the resulting
 * `router.push(...)` URL rather than on internal state.
 */
export function renderWithFilterNavigation(ui: ReactElement, searchParams = ""): RenderWithProvidersResult {
  return render(<FilterNavigationProvider>{ui}</FilterNavigationProvider>, {
    route: "/products",
    searchParams,
  })
}

/** Parses the query string of the most recent `router.push("/products?...")` call. */
export function lastPushedParams(router: RenderWithProvidersResult["router"]): URLSearchParams {
  const calls = router.push.mock.calls
  if (calls.length === 0) {
    throw new Error("router.push was never called")
  }
  const [url] = calls[calls.length - 1] as [string]
  return new URLSearchParams(url.split("?")[1] ?? "")
}
