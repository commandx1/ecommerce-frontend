import type { BrowserContext, Page } from "@playwright/test"
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

/**
 * Writes an account cookie and confirms the jar actually holds it before the caller navigates.
 * `addCookies` resolves before the value is necessarily observable, and a sibling tab's sync can
 * land in that gap - in which case the tab about to load would adopt the wrong account.
 */
async function setAccountCookie(
  context: BrowserContext,
  cookie: Awaited<ReturnType<typeof buildBuyerAuthCookie>>,
  expectRole: "Vendor" | "BUYER",
): Promise<void> {
  for (let attempt = 0; attempt < 10; attempt++) {
    await context.addCookies([cookie])
    const jar = await context.cookies()
    const current = jar.find((c) => c.name === "auth-storage")?.value ?? ""
    if (decodeURIComponent(current).includes(expectRole)) return
  }
  throw new Error(`auth-storage never settled on ${expectRole}`)
}

/**
 * Opens a tab already logged in as `expectRole` - deterministically.
 *
 * Seeding the tab's OWN `sessionStorage` before the app loads is exactly the state a real login
 * leaves behind (`tabSessionStorage.setItem` writes sessionStorage AND the cookie), and it is the
 * only way to place an account in a specific tab without racing its siblings. Writing the shared
 * cookie and letting the tab adopt it cannot be made reliable here, because
 * `tabSessionStorage.getItem` re-writes that cookie on EVERY read, deliberately un-gated on
 * visibility (its own comment: a background tab that establishes a session "must own the cookie
 * before its next navigation hits the proxy"). Any sibling tab re-rendering in the window between
 * the write here and this tab's bootstrap takes the cookie back, and adoption happens once per
 * page load - so the new tab is stuck with the wrong account for the rest of its life.
 *
 * Worse, trying to recover by clearing the tab's sessionStorage turns it into a guest, and a guest
 * tab DELETES the shared cookie on every read (the anti-bounce rule) - traced on a failing run:
 * the vendor tab, cleared for a retry, wiped `auth-storage` in a loop and the third tab could then
 * only ever land on /login. Seeding sidesteps the whole race; cookie adoption on a fresh tab is
 * covered by the unit tests over `tabSessionStorage`, not here.
 *
 * The seed is written on a static same-origin document (`/favicon.ico`), so the app never mounts
 * as a guest in this tab and never deletes a sibling's cookie on the way in.
 */
async function openTabAs(
  context: BrowserContext,
  cookie: Awaited<ReturnType<typeof buildBuyerAuthCookie>>,
  expectRole: "Vendor" | "BUYER",
  url: string,
): Promise<Page> {
  const page = await context.newPage()
  await activateTab(page)

  // The cookie carries the value URL-encoded; sessionStorage holds it decoded (cookieStorage
  // decodes on read before `safeSessionSet` stores it).
  const session = decodeURIComponent(cookie.value)
  await page.goto("/favicon.ico", { waitUntil: "domcontentloaded" })
  await page.evaluate((value) => {
    sessionStorage.setItem("auth-storage", value)
  }, session)

  await setAccountCookie(context, cookie, expectRole)
  await page.goto(url, { waitUntil: "domcontentloaded" })
  await waitForSessionAdoption(page)

  const held = await page.evaluate(() => {
    try {
      return sessionStorage.getItem("auth-storage")
    } catch {
      return null
    }
  })
  if (!held?.includes(expectRole)) {
    throw new Error(`tab did not hold ${expectRole} for ${url}: ${held}`)
  }
  return page
}

/**
 * Waits until a tab has copied the shared cookie into its OWN sessionStorage.
 *
 * `domcontentloaded` does not imply that adoption has run, and every test here writes the next
 * account's cookie immediately after the previous tab loads. Lose that race and the tab is still
 * holding nothing when the new cookie lands, so it adopts THAT account instead of the one it was
 * opened with - the tab then navigates to the wrong dashboard and the assertions downstream fail
 * for a reason that has nothing to do with per-tab sessions. Traced with a diagnostic spec: on a
 * losing run tab 1 reported `sessionStorage auth-storage = null` right after load and ended up on
 * /vendor-dashboard; on a winning run it reported the buyer state and stayed put.
 */
async function waitForSessionAdoption(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    try {
      return sessionStorage.getItem("auth-storage") !== null
    } catch {
      return true // storage blocked - the tab has nothing to adopt, so there is no race to lose
    }
  })
}

/**
 * Makes `document.visibilityState` / `document.hidden` follow a flag the test controls.
 *
 * Playwright never backgrounds a page: every tab in a context keeps reporting "visible" no matter
 * which one is in front. `bindActiveTabSync` guards its handler with
 * `visibilityState === "visible"` - correct against a real browser, but under that emulation the
 * guard is always open, so `bringToFront` makes the tabs being LEFT BEHIND re-sync their own
 * account over the shared cookie. Restoring the real semantics here is what makes these tests
 * deterministic; it patches the emulation, not the behaviour under test.
 */
async function installVisibilityControl(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    ;(window as unknown as { __tabVisible: boolean }).__tabVisible = true
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => ((window as unknown as { __tabVisible: boolean }).__tabVisible ? "visible" : "hidden"),
    })
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => !(window as unknown as { __tabVisible: boolean }).__tabVisible,
    })

    // `bindActiveTabSync` also listens for `window focus`, and that listener has no visibility
    // guard - it does not need one against a real browser, where a background tab simply never
    // receives focus. Playwright does deliver it to the tabs `bringToFront` leaves behind, and
    // their sync then writes their own account over the shared cookie. Gating delivery on the
    // same flag is the other half of restoring real semantics.
    const addEventListener = window.addEventListener.bind(window)
    window.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: unknown) => {
      if (type !== "focus" || typeof listener !== "function") {
        return addEventListener(type, listener as EventListener, options as AddEventListenerOptions)
      }
      const guarded = (event: Event) => {
        if ((window as unknown as { __tabVisible: boolean }).__tabVisible) listener(event)
      }
      return addEventListener(type, guarded, options as AddEventListenerOptions)
    }) as typeof window.addEventListener
  })
}

/**
 * Brings a tab to the front, marks every OTHER tab hidden (see `installVisibilityControl`), and
 * fires the focus/visibility events `bindActiveTabSync` listens for - then waits until the shared
 * cookie actually reflects THIS tab.
 */
async function activateTab(page: Page): Promise<void> {
  await page.bringToFront()
  for (const other of page.context().pages()) {
    if (other === page) continue
    await other
      .evaluate(() => {
        ;(window as unknown as { __tabVisible: boolean }).__tabVisible = false
        document.dispatchEvent(new Event("visibilitychange"))
      })
      .catch(() => {
        /* a tab already closed or still on about:blank has no sync to suppress */
      })
  }
  await page.evaluate(() => {
    ;(window as unknown as { __tabVisible: boolean }).__tabVisible = true
  })
  const dispatch = () =>
    page.evaluate(() => {
      window.dispatchEvent(new Event("focus"))
      document.dispatchEvent(new Event("visibilitychange"))
      try {
        return sessionStorage.getItem("auth-storage")
      } catch {
        return null
      }
    })

  const expected = await dispatch()
  await page
    .waitForFunction(
      (want) => {
        window.dispatchEvent(new Event("focus"))
        const raw = document.cookie
          .split("; ")
          .find((c) => c.startsWith("auth-storage="))
          ?.slice("auth-storage=".length)
        return want === null ? raw === undefined : raw === encodeURIComponent(want) || raw === want
      },
      expected,
      { timeout: 5000 },
    )
    .catch(() => {
      /* a guest tab with storage blocked can't settle; the assertions below still speak */
    })
}

test.describe("multi-account tabs (per-browser-tab sessions)", () => {
  test.use({ apiMockStrict: false })

  test("different tabs keep different accounts logged in and resync the cookie on focus", async ({
    context,
    baseURL,
  }) => {
    await installVisibilityControl(context)

    // 1. Buyer logs in in tab 1.
    const page1 = await openTabAs(context, buildBuyerAuthCookie({ id: BUYER_ID }, baseURL), "BUYER", "/buyer-dashboard")
    await expect(page1).toHaveURL(/\/buyer-dashboard/)

    // 2. Vendor logs in in tab 2. This overwrites the shared cookie in the context's cookie
    // jar, but tab 1 already copied the buyer state into its own sessionStorage on load.
    const page2 = await openTabAs(context, buildVendorAuthCookie({}, baseURL), "Vendor", "/vendor-dashboard")
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
    await installVisibilityControl(context)

    // 1. Tab 1 opens as a true guest - no cookie at all - and consumes its bootstrap adoption
    // with nothing to adopt.
    const page1 = await context.newPage()
    // Wait past domcontentloaded, into hydration settling (the app's own post-hydration effects,
    // e.g. cart/notifications fetches, quiet down) - otherwise this tab's bootstrap read can race
    // a sibling tab's cookie write below, which is a test-harness race unrelated to what this
    // test is verifying (an ALREADY-hydrated guest tab claiming the cookie on refocus).
    await page1.goto("/", { waitUntil: "networkidle" })

    // 2. A sibling tab logs in as Vendor and writes the shared cookie. Cookie AFTER the tab is
    // opened and focused - see the note in the first test: bringToFront makes every other tab
    // fire `visibilitychange` while still reporting "visible", so they re-sync over it.
    const page2 = await openTabAs(context, buildVendorAuthCookie({}, baseURL), "Vendor", "/vendor-dashboard")
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
    await installVisibilityControl(context)

    // Two buyer tabs (same account) plus a vendor tab (different account), none of them reloaded.
    const buyerTabA = await openTabAs(
      context,
      buildBuyerAuthCookie({ id: BUYER_ID }, baseURL),
      "BUYER",
      "/buyer-dashboard",
    )
    await expect(buyerTabA).toHaveURL(/\/buyer-dashboard/)

    const vendorTab = await openTabAs(context, buildVendorAuthCookie({}, baseURL), "Vendor", "/vendor-dashboard")
    await expect(vendorTab).toHaveURL(/\/vendor-dashboard/)

    const buyerTabB = await openTabAs(
      context,
      buildBuyerAuthCookie({ id: BUYER_ID }, baseURL),
      "BUYER",
      "/buyer-dashboard",
    )
    await expect(buyerTabB).toHaveURL(/\/buyer-dashboard/)

    // `authStore.logout()` -> `clearLocalSession()` + `broadcastLogout(userId)` writes the
    // cross-tab logout key via a real `localStorage.setItem` from tab B - the mechanism
    // `broadcastLogout` itself uses. Every OTHER same-origin tab holding that same user id
    // (`buyerTabA`) drops its session locally; a different account (`vendorTab`) is untouched.
    // Precondition, not decoration: the whole claim below is "a DIFFERENT account is untouched",
    // which is only meaningful if the vendor tab is actually still holding the vendor session.
    // Asserting it here turns a sibling tab having quietly adopted the buyer account into a
    // failure that says so, instead of a confusing bounce-to-"/" ten lines further down.
    expect(await vendorTab.evaluate(() => sessionStorage.getItem("auth-storage"))).toContain("Vendor")

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
