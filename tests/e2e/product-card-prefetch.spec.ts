import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"

/**
 * Regression lock for the blank-product-page defect.
 *
 * `/products/[id]` intermittently committed a completely EMPTY page segment on a soft navigation
 * from the listing: header + footer, no content, no `loading.tsx` fallback, no error boundary, for
 * 15s+. Nothing threw - the RSC payloads came back 200 in tens of milliseconds - so it was the
 * router committing an empty segment rather than the page failing. The route is `force-dynamic`,
 * so its prefetch can only ever cache the loading shell; disabling it costs nothing and made the
 * failure disappear: 1 failure in 108 runs before, 0 in 324 after (≈3 expected by chance, p≈0.05).
 *
 * The `prefetch={false}` that fixes it cannot be asserted in the unit suite, because the jsdom
 * `next/link` mock strips Next-only routing props. So it is locked here, against the real thing:
 * loading the listing must not fire an RSC prefetch for a product detail route.
 */
test.use({ apiMockStrict: false })

test("the listing does not prefetch product detail routes", async ({ guestPage, apiMock }) => {
  registerAllMocks(apiMock)

  const detailPrefetches: string[] = []
  guestPage.on("request", (request) => {
    const url = request.url()
    // `?_rsc=` is the App Router's payload fetch; on a link that is only being prefetched (not
    // clicked) it is the prefetch itself. Match the detail route, not the listing route.
    if (/\/products\/[^/?]+\?[^ ]*_rsc=/.test(url)) detailPrefetches.push(url)
  })

  await guestPage.goto("/products", { waitUntil: "domcontentloaded" })
  await expect(guestPage.getByRole("heading", { level: 1 })).toBeAttached()
  // Cards are in the viewport, so an enabled prefetch would have fired by now.
  await guestPage.waitForTimeout(4000)

  expect(
    detailPrefetches,
    "ProductCard's title <Link> must keep prefetch={false} - see the comment on it in ProductCard.tsx",
  ).toEqual([])
})
