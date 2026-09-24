import type { Page, Request } from "@playwright/test"
import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { ProductDetailPage } from "./pages/product-detail.page"
import { ProductListingPage } from "./pages/product-listing.page"

/**
 * Guest add-to-cart -> /login redirect -> return-to-page feature (see
 * src/lib/api/client.ts buildLoginUrl/redirectToLogin, src/stores/cartStore.ts
 * addToCart's guest guard, src/features/login/hooks/useLoginForm.ts,
 * src/lib/utils/safe-redirect.ts, src/app/verify-2fa/page.tsx).
 *
 * Desktop-only: the login form / product purchase panel layout is not
 * verified against the mobile-chrome viewport elsewhere in this suite either
 * (see playwright.config.ts's `testIgnore` on browse-to-cart.spec.ts and
 * friends) - skipped here the same way, via `test.skip` per the task brief
 * instead of editing that config array.
 */
test.describe("guest add-to-cart -> login redirect -> return", () => {
  // biome-ignore lint/correctness/noEmptyPattern: Playwright requires an object-destructuring first param even when no fixtures are used.
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name === "mobile-chrome",
      "Desktop-only layout, mirrors browse-to-cart.spec.ts's testIgnore",
    )
  })

  /** Minimal, syntactically-valid unsigned JWT with a numeric `exp` far in the future - `isJwtExpired` (client.ts) only reads the payload, never verifies the signature. */
  const buildJwt = (secondsFromNow: number): string => {
    const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url")
    const exp = Math.floor(Date.now() / 1000) + secondsFromNow
    return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: "buyer@example.com", exp })}.sig`
  }

  /** LoginResponse shape useLoginForm consumes (see src/features/login/hooks/useLoginForm.ts's `userData`/setAuth call). */
  const buildLoginResponse = (overrides: Record<string, unknown> = {}) => ({
    id: "user-1",
    name: "Serhat",
    surname: "Belen",
    email: "buyer@example.com",
    phoneNumber: "+15551234567",
    emailConfirmed: true,
    phoneNumberConfirmed: true,
    twoFactorEnabled: false,
    lockoutEnd: null,
    createdDate: "2026-01-01T00:00:00Z",
    roleName: "BUYER",
    accessToken: buildJwt(3600),
    refreshToken: "refresh-token-1",
    ...overrides,
  })

  const fillAndSubmitLogin = async (page: Page, email = "buyer@example.com", password = "secret123") => {
    // LoginFormFields.tsx sets id="email"/"password" on the TextField/PasswordField inputs -
    // getByLabel("Password") ambiguously also matches the "Show password" reveal button's
    // aria-label, and the FormField's required-asterisk ("Password *") breaks an exact match.
    const submit = page.getByRole("button", { name: "Sign In" })

    const enterCredentials = async () => {
      await page.locator("#email").fill(email)
      await page.locator("#password").fill(password)
    }

    await enterCredentials()

    // AsyncSubmitButton is `disabled={!isFormValid}`, and isFormValid comes from React state. A
    // fill that lands before hydration writes the DOM values but React never sees them, so the
    // button stays disabled FOREVER - not a transient - and `click()` times out on "enabled".
    // That is what made this spec fail under suite load while passing 3/3 on its own. Re-entering
    // once after hydration is what actually unblocks it; if the button still will not enable, the
    // test fails as it should rather than being papered over.
    await submit.waitFor({ state: "attached" })
    if (await submit.isDisabled()) {
      await enterCredentials()
    }
    await expect(submit).toBeEnabled({ timeout: 10_000 })
    await submit.click()
  }

  const submitTwoFactorCode = async (page: Page, code = "123456") => {
    await page.getByLabel("Verification Code").fill(code)
    await page.getByRole("button", { name: /Verify & Sign In/i }).click()
  }

  /** Tracks every request whose URL contains `urlFragment`, across the whole test. */
  const trackRequests = (page: Page, method: string, urlFragment: string): Request[] => {
    const seen: Request[] = []
    page.on("request", (req) => {
      if (req.method() === method && req.url().includes(urlFragment)) {
        seen.push(req)
      }
    })
    return seen
  }

  test("product detail: redirects to /login, no auto-add on return, then a real add-to-cart POST", async ({
    guestPage,
    apiMock,
  }) => {
    registerAllMocks(apiMock)
    apiMock.on("POST", "/api/auth/login", () => ({ body: buildLoginResponse() }))

    const cartAddRequests = trackRequests(guestPage, "POST", "/backend-api/cart/items")

    const detail = new ProductDetailPage(guestPage, "p-1")
    await guestPage.goto(detail.path)
    await expect(detail.mainHeading).toBeVisible({ timeout: 15_000 })

    // useSupplierSelection.ts auto-appends `?vendorId=<bestPrice>` via router.replace shortly
    // after mount - wait for it to settle so the expected redirect target is computed from the
    // real URL the guard will see, not a hardcoded guess.
    await expect.poll(() => new URL(guestPage.url()).searchParams.get("vendorId")).toBe("up-1")
    const preClickUrl = new URL(guestPage.url())
    const expectedRedirect = `${preClickUrl.pathname}${preClickUrl.search}`

    await detail.addToCartButton.click()
    await guestPage.waitForURL(/\/login/)

    const loginUrl = new URL(guestPage.url())
    expect(loginUrl.pathname).toBe("/login")
    expect(loginUrl.searchParams.get("reason")).toBe("login-required")
    expect(loginUrl.searchParams.get("redirect")).toBe(expectedRedirect)
    expect(cartAddRequests).toHaveLength(0)

    await expect(guestPage.getByText("Sign in to continue")).toBeVisible()
    await expect(guestPage.getByText("Please sign in to add products to your cart.")).toBeVisible()

    await fillAndSubmitLogin(guestPage)
    await guestPage.waitForURL((url) => url.pathname === preClickUrl.pathname)

    expect(new URL(guestPage.url()).pathname + new URL(guestPage.url()).search).toBe(expectedRedirect)
    // No auto-add: logging in must not have added anything on its own.
    expect(cartAddRequests).toHaveLength(0)

    // The mocked GET /backend-api/cart (registerCartMocks -> makeCart(), one item, quantity 2)
    // is fetched by useAuthHydration.ts the moment isAuthenticated flips true - the badge showing
    // "2" here is that pre-existing cart, not evidence of an add the guest never triggered.
    await expect(detail.cartBadge).toContainText("2")

    // Now actually add to cart (authenticated) - exactly one POST, with the real payload shape.
    const addItemRequest = guestPage.waitForRequest(
      (req) => req.url().includes("/backend-api/cart/items") && req.method() === "POST",
    )
    await detail.addToCartButton.click()
    const request = await addItemRequest
    const body = request.postDataJSON() as { userProductId?: string; quantity?: number; autoOrder?: unknown }
    expect(body).toEqual({ userProductId: "up-1", quantity: 1, autoOrder: null })
    expect(cartAddRequests).toHaveLength(1)
  })

  test("listing page with a query string carries the full path+query into redirect, no offers/cart requests", async ({
    guestPage,
    apiMock,
  }) => {
    registerAllMocks(apiMock)

    const cartAddRequests = trackRequests(guestPage, "POST", "/backend-api/cart/items")
    const offersRequests = trackRequests(guestPage, "GET", "with-user-products")

    const listing = new ProductListingPage(guestPage)
    await guestPage.goto(`${listing.path}?inStock=true`, { waitUntil: "domcontentloaded" })
    await expect(listing.mainHeading).toBeVisible()

    await guestPage.getByRole("button", { name: "Add to Cart" }).first().click()
    await guestPage.waitForURL(/\/login/)

    const loginUrl = new URL(guestPage.url())
    expect(loginUrl.searchParams.get("reason")).toBe("login-required")
    expect(loginUrl.searchParams.get("redirect")).toBe("/products?inStock=true")
    expect(cartAddRequests).toHaveLength(0)
    expect(offersRequests).toHaveLength(0)
  })

  test("2FA chain: verify-2fa carries redirect, Back to Sign In keeps it, success returns to the product page", async ({
    guestPage,
    apiMock,
  }) => {
    registerAllMocks(apiMock)
    apiMock.on("POST", "/api/auth/login", () => ({
      body: { twoFactorRequired: true, message: "Code sent." },
    }))
    apiMock.on("POST", "/api/auth/login/verify-2fa", () => ({ body: buildLoginResponse() }))

    const detail = new ProductDetailPage(guestPage, "p-1")
    await guestPage.goto(detail.path)
    await expect(detail.mainHeading).toBeVisible({ timeout: 15_000 })
    await expect.poll(() => new URL(guestPage.url()).searchParams.get("vendorId")).toBe("up-1")
    const preClickUrl = new URL(guestPage.url())
    const expectedRedirect = `${preClickUrl.pathname}${preClickUrl.search}`

    await detail.addToCartButton.click()
    await guestPage.waitForURL(/\/login/)

    await fillAndSubmitLogin(guestPage)
    await guestPage.waitForURL(/\/verify-2fa/)

    const verifyUrl = new URL(guestPage.url())
    expect(verifyUrl.pathname).toBe("/verify-2fa")
    expect(verifyUrl.searchParams.get("redirect")).toBe(expectedRedirect)

    const backLink = guestPage.getByRole("link", { name: /Back to Sign In/i })
    await expect(backLink).toHaveAttribute("href", `/login?redirect=${encodeURIComponent(expectedRedirect)}`)

    await submitTwoFactorCode(guestPage)
    await guestPage.waitForURL((url) => url.pathname === preClickUrl.pathname)

    expect(new URL(guestPage.url()).pathname + new URL(guestPage.url()).search).toBe(expectedRedirect)
  })

  test("a wrong password attempt does not lose the redirect - the next successful login still returns to the product page", async ({
    guestPage,
    apiMock,
  }) => {
    registerAllMocks(apiMock)
    let loginAttempts = 0
    apiMock.on("POST", "/api/auth/login", () => {
      loginAttempts += 1
      if (loginAttempts === 1) {
        return { status: 401, body: { message: "Invalid email or password" } }
      }
      return { body: buildLoginResponse() }
    })

    const detail = new ProductDetailPage(guestPage, "p-1")
    await guestPage.goto(detail.path)
    await expect(detail.mainHeading).toBeVisible({ timeout: 15_000 })
    await expect.poll(() => new URL(guestPage.url()).searchParams.get("vendorId")).toBe("up-1")
    const preClickUrl = new URL(guestPage.url())
    const expectedRedirect = `${preClickUrl.pathname}${preClickUrl.search}`

    await detail.addToCartButton.click()
    await guestPage.waitForURL(/\/login/)
    const loginPageUrl = guestPage.url()

    await fillAndSubmitLogin(guestPage, "buyer@example.com", "wrong-password")
    await expect(guestPage.getByText("Invalid credentials")).toBeVisible()
    // Still on /login with the same redirect - the failed attempt did not drop it.
    expect(guestPage.url()).toBe(loginPageUrl)

    await fillAndSubmitLogin(guestPage, "buyer@example.com", "correct-password")
    await guestPage.waitForURL((url) => url.pathname === preClickUrl.pathname)

    expect(new URL(guestPage.url()).pathname + new URL(guestPage.url()).search).toBe(expectedRedirect)
    expect(loginAttempts).toBe(2)
  })

  test("a hostile redirect (tab-smuggled evil.com) never navigates off-origin and lands on /", async ({
    guestPage,
    apiMock,
    baseURL,
  }) => {
    registerAllMocks(apiMock)
    apiMock.on("POST", "/api/auth/login", () => ({ body: buildLoginResponse() }))

    let evilHostHit = false
    await guestPage.route(
      (url) => url.hostname.endsWith("evil.com"),
      async (route) => {
        evilHostHit = true
        await route.fulfill({ status: 200, body: "should never be reached" })
      },
    )

    await guestPage.goto("/login?redirect=%2F%09%2Fevil.com", { waitUntil: "domcontentloaded" })
    await fillAndSubmitLogin(guestPage)

    await guestPage.waitForURL((url) => url.pathname === "/")
    const finalUrl = new URL(guestPage.url())
    expect(finalUrl.origin).toBe(new URL(baseURL ?? "http://localhost:3100").origin)
    expect(finalUrl.hostname).not.toContain("evil.com")
    expect(finalUrl.pathname).toBe("/")
    expect(evilHostHit).toBe(false)
  })

  // Regression: an authenticated buyer adding to cart from the product detail page is NOT
  // redirected to /login, and the real add-to-cart POST goes out. Already covered end-to-end by
  // "listing -> product detail -> select a supplier -> add to cart -> header badge updates" in
  // tests/e2e/browse-to-cart.spec.ts (asserts the POST /backend-api/cart/items body and the
  // resulting cart badge for a `buyerPage`) - not duplicated here; run that spec alongside this
  // one for that coverage.
})
