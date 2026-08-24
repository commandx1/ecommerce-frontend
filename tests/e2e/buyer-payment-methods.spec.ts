import { makeApiSavedCard } from "@/test/factories/payment.factory"
import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { BuyerPaymentMethodsPage } from "./pages/buyer-payment-methods.page"

/**
 * `GET /backend-api/cards` is NOT registered by payments.mocks.ts (the
 * handler wraps the card list in a `{ cards, total }` literal with no
 * exported factory - see that file's header comment) - registered per-spec
 * here, per the task brief.
 */
const twoCards = {
  cards: [
    makeApiSavedCard({ id: "pm-1", name: "Main Clinic Card", isDefault: true, last4: "4532" }),
    makeApiSavedCard({ id: "pm-2", name: "Backup Card", isDefault: false, last4: "1111" }),
  ],
  total: 2,
}

test.describe("buyer payment methods", () => {
  test("lists saved cards from GET /backend-api/cards", async ({ buyerPage, apiMock }) => {
    apiMock.on("GET", "/backend-api/cards", () => ({ body: twoCards }))
    registerAllMocks(apiMock)

    const page = new BuyerPaymentMethodsPage(buyerPage)
    await page.goto()

    await expect(page.cardByNickname("Main Clinic Card")).toBeVisible()
    await expect(page.cardByNickname("Backup Card")).toBeVisible()
  })

  test("sets a non-default card as default via PATCH /backend-api/cards/:id/default", async ({
    buyerPage,
    apiMock,
  }) => {
    apiMock.on("GET", "/backend-api/cards", () => ({ body: twoCards }))
    registerAllMocks(apiMock)

    const page = new BuyerPaymentMethodsPage(buyerPage)
    await page.goto()

    const backupCard = page.cardByNickname("Backup Card")
    await page.setDefaultTrigger(backupCard).click()

    const patchRequest = buyerPage.waitForRequest(
      (req) => req.method() === "PATCH" && req.url().includes("/backend-api/cards/pm-2/default"),
    )
    await page.confirmSetDefaultButton().click()
    await patchRequest

    await expect(buyerPage.locator("[data-sonner-toaster] li[data-sonner-toast]")).toContainText("Default updated")
  })

  test("removes a card via DELETE /backend-api/cards/:id", async ({ buyerPage, apiMock }) => {
    apiMock.on("GET", "/backend-api/cards", () => ({ body: twoCards }))
    registerAllMocks(apiMock)

    const page = new BuyerPaymentMethodsPage(buyerPage)
    await page.goto()

    const backupCard = page.cardByNickname("Backup Card")
    await page.removeCardTrigger(backupCard).click()

    const deleteRequest = buyerPage.waitForRequest(
      (req) => req.method() === "DELETE" && req.url().includes("/backend-api/cards/pm-2"),
    )
    await page.confirmRemoveButton().click()
    await deleteRequest

    await expect(buyerPage.locator("[data-sonner-toaster] li[data-sonner-toast]")).toContainText("Card removed")
  })

  test("add-card flow: when Stripe.js fails to load, the form reports it instead of silently hanging", async ({
    buyerPage,
    apiMock,
  }) => {
    // Stripe Elements' CardNumberElement lives in a cross-origin iframe that
    // can't be automated. Per the task brief, block js.stripe.com and assert
    // the app's actual fallback behaviour: `useStripe()`/`useElements()` stay
    // null forever, so `handleAddCard` (BuyerPaymentMethodsPage.tsx) hits its
    // `if (!stripe || !elements)` guard and reports "Stripe not ready" rather
    // than hanging or silently no-op'ing.
    await buyerPage.route("https://js.stripe.com/**", (route) => route.abort())

    apiMock.on("GET", "/backend-api/cards", () => ({ body: twoCards }))
    registerAllMocks(apiMock)

    const page = new BuyerPaymentMethodsPage(buyerPage)
    await page.goto()

    await page.addNewCardButton.click()
    await page.nicknameInput.fill("New Card")
    await page.saveCardButton.click()

    await expect(buyerPage.locator("[data-sonner-toaster] li[data-sonner-toast]")).toContainText("Stripe not ready", {
      timeout: 10_000,
    })
  })
})
