import { makeAutoOrder, makeAutoOrdersResponse } from "@/test/factories/auto-order.factory"
import { makeApiSavedCard } from "@/test/factories/payment.factory"
import { makeAddress } from "@/test/factories/user.factory"
import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { BuyerAutoOrdersPage } from "./pages/buyer-auto-orders.page"

/**
 * Faz 8.2 - /buyer-dashboard/auto-orders (BuyerAutoOrdersPage, useAutoOrders hook).
 *
 * Readiness banner: `useAutoOrders`'s `fetchReadiness` calls
 * `GET /backend-api/address` (registered by default via registerAccountMocks
 * with a `defaultAddress: true` item) and `GET /backend-api/cards` (NOT
 * registered by default - registered per-test here). Both calls are wrapped
 * in `.catch(() => [])`, so an unmocked one would silently resolve to an
 * empty array in the app - but under `apiMock`'s strict mode it is recorded
 * as an unmatched request and fails the test at teardown, so every test
 * below registers `GET /backend-api/cards` explicitly even when it isn't the
 * thing under test.
 */

const ACTIVE_ORDER = makeAutoOrder({
  id: "auto-order-active",
  productName: "Intra Oral Mixing Tips Yellow 100/Pk - MARK3",
  quantity: 2,
  period: "ONE_MONTH",
  active: true,
  nextOrderDate: "2026-09-14T18:06:14.835534",
})

const PAUSED_ORDER = makeAutoOrder({
  id: "auto-order-paused",
  productName: "Dental Floss 50-Pack",
  quantity: 5,
  period: "TWO_WEEKS",
  active: false,
  nextOrderDate: "2026-09-01T00:00:00",
})

test.describe("buyer auto orders", () => {
  test("renders the auto order list with active and paused schedules", async ({ buyerPage, apiMock }) => {
    apiMock.on("GET", "/backend-api/auto-orders", () => ({
      body: makeAutoOrdersResponse({ autoOrders: [ACTIVE_ORDER, PAUSED_ORDER], total: 2 }),
    }))
    apiMock.on("GET", "/backend-api/cards", () => ({ body: { cards: [], total: 0 } }))
    registerAllMocks(apiMock)

    const autoOrders = new BuyerAutoOrdersPage(buyerPage)
    await autoOrders.goto()

    await expect(autoOrders.mainHeading).toHaveText("Auto Orders")
    await expect(autoOrders.card(ACTIVE_ORDER.productName as string)).toBeVisible()
    await expect(autoOrders.card(PAUSED_ORDER.productName as string)).toBeVisible()
    await expect(autoOrders.card(PAUSED_ORDER.productName as string).getByText("Paused")).toBeVisible()

    // Filtering to "Paused" hides the active order.
    await autoOrders.filterPaused.click()
    await expect(autoOrders.card(ACTIVE_ORDER.productName as string)).toBeHidden()
    await expect(autoOrders.card(PAUSED_ORDER.productName as string)).toBeVisible()
  })

  test("editing an auto order sends a PATCH with the updated quantity and period", async ({ buyerPage, apiMock }) => {
    apiMock.on("GET", "/backend-api/auto-orders", () => ({
      body: makeAutoOrdersResponse({ autoOrders: [ACTIVE_ORDER], total: 1 }),
    }))
    apiMock.on("PATCH", "/backend-api/auto-orders/:autoOrderId", ({ params }) => ({
      body: { ...ACTIVE_ORDER, id: params.autoOrderId, quantity: 3, period: "TWO_MONTHS" },
    }))
    apiMock.on("GET", "/backend-api/cards", () => ({ body: { cards: [], total: 0 } }))
    registerAllMocks(apiMock)

    const autoOrders = new BuyerAutoOrdersPage(buyerPage)
    await autoOrders.goto()

    await autoOrders.editButton(ACTIVE_ORDER.productName as string).click()
    await expect(autoOrders.editModalHeading).toBeVisible()

    await autoOrders.quantityIncreaseButton.click()

    // FINDING: changing the frequency Select is only exercisable in a real
    // browser - Radix Select's option list renders into a portal, which
    // jsdom-based unit tests (AutoOrderEditModal.test.tsx) can't interact
    // with, so the "countdown resets" notice below has no unit coverage.
    await autoOrders.frequencySelect.click()
    await autoOrders.frequencyOption("Every 60 days").click()
    await expect(autoOrders.frequencyChangedNotice).toBeVisible()

    const patchRequest = buyerPage.waitForRequest(
      (request) => request.method() === "PATCH" && request.url().includes("/backend-api/auto-orders/"),
    )
    await autoOrders.saveChangesButton.click()
    const request = await patchRequest

    expect(request.postDataJSON()).toEqual({ quantity: 3, period: "TWO_MONTHS" })
    await expect(autoOrders.toast).toContainText("Auto order updated")
  })

  test("removing an auto order sends a DELETE for that auto order's id", async ({ buyerPage, apiMock }) => {
    apiMock.on("GET", "/backend-api/auto-orders", () => ({
      body: makeAutoOrdersResponse({ autoOrders: [ACTIVE_ORDER], total: 1 }),
    }))
    apiMock.on("DELETE", "/backend-api/auto-orders/:autoOrderId", () => ({ status: 204 }))
    apiMock.on("GET", "/backend-api/cards", () => ({ body: { cards: [], total: 0 } }))
    registerAllMocks(apiMock)

    const autoOrders = new BuyerAutoOrdersPage(buyerPage)
    await autoOrders.goto()

    await autoOrders.removeButton(ACTIVE_ORDER.productName as string).click()
    // ConfirmationModal renders both a visually-hidden Radix DialogTitle
    // (<h2>, the dialog's accessible name) and its own visible <h3> with the
    // same text - scope to the heading role to avoid matching both.
    await expect(
      autoOrders.deleteDialog.getByRole("heading", { name: "Remove this auto order?", level: 3 }),
    ).toBeVisible()

    const deleteRequest = buyerPage.waitForRequest(
      (request) =>
        request.method() === "DELETE" && request.url().endsWith(`/backend-api/auto-orders/${ACTIVE_ORDER.id}`),
    )
    await autoOrders.confirmRemoveButton.click()
    await deleteRequest

    await expect(autoOrders.toast).toContainText("Auto order removed")
    await expect(autoOrders.card(ACTIVE_ORDER.productName as string)).toBeHidden()
  })

  test("readiness banner is hidden once a primary address and an auto order card exist", async ({
    buyerPage,
    apiMock,
  }) => {
    apiMock.on("GET", "/backend-api/auto-orders", () => ({
      body: makeAutoOrdersResponse({ autoOrders: [PAUSED_ORDER], total: 1 }),
    }))
    // Default GET /backend-api/address (registerAccountMocks) already returns
    // a defaultAddress: true item - only the card needs to satisfy readiness.
    apiMock.on("GET", "/backend-api/cards", () => ({
      body: { cards: [makeApiSavedCard({ autoOrderCard: true, openToAutoPayment: true })], total: 1 },
    }))
    registerAllMocks(apiMock)

    const autoOrders = new BuyerAutoOrdersPage(buyerPage)
    await autoOrders.goto()

    await expect(autoOrders.card(PAUSED_ORDER.productName as string)).toBeVisible()
    await expect(autoOrders.readinessBanner).toBeHidden()
  })

  test("readiness banner asks only for a card when the address is already set", async ({ buyerPage, apiMock }) => {
    apiMock.on("GET", "/backend-api/auto-orders", () => ({
      body: makeAutoOrdersResponse({ autoOrders: [PAUSED_ORDER], total: 1 }),
    }))
    // No card at all -> hasAutoOrderCard stays false; default address stays true.
    apiMock.on("GET", "/backend-api/cards", () => ({ body: { cards: [], total: 0 } }))
    registerAllMocks(apiMock)

    const autoOrders = new BuyerAutoOrdersPage(buyerPage)
    await autoOrders.goto()

    await expect(autoOrders.readinessBanner).toBeVisible()
    await expect(buyerPage.getByRole("link", { name: "Choose a card for auto orders" })).toBeVisible()
    await expect(buyerPage.getByRole("link", { name: "Set a primary address" })).toBeHidden()
  })

  test("readiness banner asks only for an address when a valid auto order card exists", async ({
    buyerPage,
    apiMock,
  }) => {
    apiMock.on("GET", "/backend-api/auto-orders", () => ({
      body: makeAutoOrdersResponse({ autoOrders: [PAUSED_ORDER], total: 1 }),
    }))
    // Override the default GET /backend-api/address BEFORE registerAllMocks -
    // apiMock matches the first registered handler for a given method+path.
    apiMock.on("GET", "/backend-api/address", () => ({ body: [makeAddress({ defaultAddress: false })] }))
    apiMock.on("GET", "/backend-api/cards", () => ({
      body: { cards: [makeApiSavedCard({ autoOrderCard: true, openToAutoPayment: true })], total: 1 },
    }))
    registerAllMocks(apiMock)

    const autoOrders = new BuyerAutoOrdersPage(buyerPage)
    await autoOrders.goto()

    await expect(autoOrders.readinessBanner).toBeVisible()
    await expect(buyerPage.getByRole("link", { name: "Set a primary address" })).toBeVisible()
    await expect(buyerPage.getByRole("link", { name: "Choose a card for auto orders" })).toBeHidden()
  })
})
