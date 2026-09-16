import type { Page } from "@playwright/test"
import { expect, test } from "./fixtures/auth.fixture"
import { buildBuyerAuthCookie, buildVendorAuthCookie } from "./fixtures/auth-cookie"

/**
 * Per-tab sessions (`src/lib/storage/tab-session-storage.ts` on top of the existing
 * `auth-storage` cookie) let different tabs of the SAME browser hold different accounts, while
 * the shared cookie keeps mirroring whichever tab is focused - so server-side readers
 * (`src/proxy.ts`, dashboard layouts) always resolve to the focused tab's account.
 *
 * All pages below are plain `context.newPage()` tabs (not the `buyerPage`/`vendorPage` fixtures,
 * which all point at the SAME underlying `page`) - the whole point here is several independent
 * tabs sharing one cookie jar but not sharing `sessionStorage`.
 */

const BUYER_ID = "buyer-cross-tab-1"

/** Brings a tab to the front and fires the focus/visibility events `bindActiveTabSync` listens for. */
async function activateTab(page: Page): Promise<void> {
  await page.bringToFront()
  await page.evaluate(() => {
    window.dispatchEvent(new Event("focus"))
    document.dispatchEvent(new Event("visibilitychange"))
  })
}

test.describe("multi-account tabs (per-browser-tab sessions)", () => {
  test.use({ apiMockStrict: false })

  test("different tabs keep different accounts logged in and resync the cookie on focus", async ({
    context,
    baseURL,
  }) => {
    // 1. Buyer logs in in tab 1.
    await context.addCookies([buildBuyerAuthCookie({ id: BUYER_ID }, baseURL)])
    const page1 = await context.newPage()
    await page1.goto("/buyer-dashboard", { waitUntil: "domcontentloaded" })
    await expect(page1).toHaveURL(/\/buyer-dashboard/)

    // 2. Vendor logs in in tab 2. This overwrites the shared cookie in the context's cookie
    // jar, but tab 1 already copied the buyer state into its own sessionStorage on load.
    await context.addCookies([buildVendorAuthCookie({}, baseURL)])
    const page2 = await context.newPage()
    // Real "open a new tab" moves focus to it as part of the same user gesture - do the same
    // here before navigating, so tab 1 can't win a race and re-persist its own account over the
    // cookie tab 2's fresh session is about to read.
    await activateTab(page2)
    await page2.goto("/vendor-dashboard", { waitUntil: "domcontentloaded" })
    await expect(page2).toHaveURL(/\/vendor-dashboard/)

    // 3. Bringing tab 1 back to the front resyncs the shared cookie to the buyer account (the
    // `focus` listener from `bindActiveTabSync`), so a reload still lands on the buyer
    // dashboard instead of being bounced by the vendor cookie tab 2 just wrote.
    await activateTab(page1)
    await page1.waitForFunction(() => document.cookie.includes("auth-storage") && !document.cookie.includes("Vendor"))
    await page1.reload({ waitUntil: "domcontentloaded" })
    await expect(page1).toHaveURL(/\/buyer-dashboard/)

    // And the same the other way: focusing tab 2 flips the shared cookie back to vendor.
    await activateTab(page2)
    await page2.waitForFunction(() => document.cookie.includes("Vendor"))
    await page2.reload({ waitUntil: "domcontentloaded" })
    await expect(page2).toHaveURL(/\/vendor-dashboard/)
  })

  test("a guest tab is not bounced into a loop by a sibling tab's vendor cookie", async ({ context, baseURL }) => {
    // 1. Tab 1 opens as a true guest - no cookie at all - and consumes its bootstrap adoption
    // with nothing to adopt.
    const page1 = await context.newPage()
    // Wait past domcontentloaded, into hydration settling (the app's own post-hydration effects,
    // e.g. cart/notifications fetches, quiet down) - otherwise this tab's bootstrap read can race
    // a sibling tab's cookie write below, which is a test-harness race unrelated to what this
    // test is verifying (an ALREADY-hydrated guest tab claiming the cookie on refocus).
    await page1.goto("/", { waitUntil: "networkidle" })

    // 2. A sibling tab logs in as Vendor and writes the shared cookie.
    await context.addCookies([buildVendorAuthCookie({}, baseURL)])
    const page2 = await context.newPage()
    await activateTab(page2)
    await page2.goto("/vendor-dashboard", { waitUntil: "domcontentloaded" })
    await expect(page2).toHaveURL(/\/vendor-dashboard/)

    // 3. Bringing tab 1 (still a guest) back to the front must claim the cookie as guest - not
    // silently inherit the sibling's Vendor cookie, which would otherwise bounce tab 1's next
    // navigation into the proxy.ts <-> vendor-dashboard-layout redirect loop (BUG-1).
    await activateTab(page1)
    await expect.poll(() => page1.evaluate(() => document.cookie.includes("auth-storage"))).toBe(false)

    await page1.goto("/products", { waitUntil: "domcontentloaded" })
    await expect(page1).toHaveURL(/\/products$/)

    // 4. Focusing tab 2 again puts the Vendor cookie back, and a reload still resolves to its
    // own account - unaffected by tab 1 having claimed the cookie as guest in between.
    await activateTab(page2)
    await page2.waitForFunction(() => document.cookie.includes("Vendor"))
    await page2.reload({ waitUntil: "domcontentloaded" })
    await expect(page2).toHaveURL(/\/vendor-dashboard/)
  })

  test("a real cross-tab logout clears a matching tab's session and leaves a different account alone", async ({
    context,
    baseURL,
  }) => {
    // Two buyer tabs (same account) plus a vendor tab (different account), none of them reloaded.
    await context.addCookies([buildBuyerAuthCookie({ id: BUYER_ID }, baseURL)])
    const buyerTabA = await context.newPage()
    await buyerTabA.goto("/buyer-dashboard", { waitUntil: "domcontentloaded" })
    await expect(buyerTabA).toHaveURL(/\/buyer-dashboard/)

    await context.addCookies([buildVendorAuthCookie({}, baseURL)])
    const vendorTab = await context.newPage()
    await activateTab(vendorTab)
    await vendorTab.goto("/vendor-dashboard", { waitUntil: "domcontentloaded" })
    await expect(vendorTab).toHaveURL(/\/vendor-dashboard/)

    await context.addCookies([buildBuyerAuthCookie({ id: BUYER_ID }, baseURL)])
    const buyerTabB = await context.newPage()
    await activateTab(buyerTabB)
    await buyerTabB.goto("/buyer-dashboard", { waitUntil: "domcontentloaded" })
    await expect(buyerTabB).toHaveURL(/\/buyer-dashboard/)

    // `authStore.logout()` -> `clearLocalSession()` + `broadcastLogout(userId)` writes the
    // cross-tab logout key via a real `localStorage.setItem` from tab B - the mechanism
    // `broadcastLogout` itself uses. Every OTHER same-origin tab holding that same user id
    // (`buyerTabA`) drops its session locally; a different account (`vendorTab`) is untouched.
    const logoutPayload = JSON.stringify({ userId: BUYER_ID, at: Date.now() })
    await buyerTabB.evaluate((payload) => {
      window.localStorage.setItem("auth-logout", payload)
    }, logoutPayload)

    await expect
      .poll(() => buyerTabA.evaluate(() => sessionStorage.getItem("auth-storage")), { timeout: 10_000 })
      .toBeNull()

    // buyerTabA (same account) leaves the buyer dashboard once its store clears - the
    // buyer-dashboard layout's own auth guard pushes it to "/" (it was authenticated before).
    await expect(buyerTabA).toHaveURL(/\/$/, { timeout: 10_000 })
    // vendorTab (a different account) never received a matching user id and stays put.
    await expect(vendorTab).toHaveURL(/\/vendor-dashboard/)
  })
})
