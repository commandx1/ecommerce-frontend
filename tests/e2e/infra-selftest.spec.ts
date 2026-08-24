import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"

/**
 * Faz 8.1 - infrastructure self-test. Not a feature/regression test; proves
 * the four pieces built in this phase actually work together:
 *
 *  (B) `buyerPage` seeds a real zustand-persist-shaped `auth-storage` cookie
 *      (see ./fixtures/auth-cookie.ts) and `authStore` hydrates it client-side
 *      - the buyer dashboard layout must NOT redirect to /login.
 *  (A + C) `apiMock` + the `tests/e2e/mocks/*.mocks.ts` adapters serve a
 *      registered route from a real handler-derived factory.
 *  (A) an unmatched request under the catch-all pattern gets `599` and is
 *      recorded in `apiMock.unmatchedRequests`, observed here via
 *      `test.use({ apiMockStrict: false })` so the fixture's own automatic
 *      teardown assertion doesn't fail this test for the thing it's meant to
 *      demonstrate.
 */

test("buyerPage cookie is hydrated by authStore - no redirect to /login", async ({ buyerPage, apiMock }) => {
  registerAllMocks(apiMock)

  await buyerPage.goto("/buyer-dashboard/orders")

  await expect(buyerPage).not.toHaveURL(/\/login/)
  await expect(buyerPage.getByRole("heading", { name: "Your Orders" })).toBeVisible()
})

test.describe("unmatched request handling", () => {
  test.use({ apiMockStrict: false })

  test("an unregistered /backend-api/** request gets 599 and is recorded", async ({ guestPage, apiMock }) => {
    // Deliberately do NOT register anything - every request under the
    // apiMock's catch-all pattern is "unmatched" in this test. Navigate to a
    // real page first (about:blank has no origin to resolve a relative
    // fetch() URL against), the login page needs no auth cookie.
    await guestPage.goto("/login")

    const status = await guestPage.evaluate(async () => {
      const res = await fetch("/backend-api/does-not-exist")
      return res.status
    })

    expect(status).toBe(599)
    // Use containment, not exact-array equality: /login itself may fire its
    // own (also-unregistered) backend-api calls on mount, which is fine -
    // apiMockStrict: false is exactly what opts this test out of the
    // fixture's normal "no unmatched requests" teardown assertion.
    expect(apiMock.unmatchedRequests).toContainEqual(
      expect.objectContaining({ method: "GET", url: expect.stringContaining("/backend-api/does-not-exist") }),
    )
  })
})
