import {
  makeBuyerOrder,
  makeBuyerOrderItem,
  makeBuyerOrderSellerGroup,
  makeBuyerOrdersResponse,
  makeVendorOrder,
  makeVendorOrdersResponse,
} from "@/test/factories/order.factory"
import type { ApiMock } from "./fixtures/api-mock.fixture"
import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { makeMockNotification, makeMockNotificationsPage } from "./mocks/notifications.mocks"
import { NotificationsPage } from "./pages/notifications.page"

/**
 * A notification that carries an `orderId` opens `/{role}-dashboard/orders?orderId=<uuid>` and the
 * page lists only that order. The order mocks answer the way the backend does
 * (OrderQueryService): with `orderId` they return just that order and ignore `type`.
 *
 * Desktop viewport: the assertions target `OrdersTable`, which is CSS-hidden below `lg`.
 */
test.use({ viewport: { width: 1280, height: 900 } })

const TARGET_ORDER_ID = "3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b"

const TARGET_ORDER = makeBuyerOrder({
  orderId: TARGET_ORDER_ID,
  sellerGroups: [
    makeBuyerOrderSellerGroup({
      sellerId: "seller-target",
      sellerName: "Target",
      sellerSurname: "Seller",
      orderItems: [makeBuyerOrderItem({ id: "item-target", productName: "Deep Link Kit" })],
    }),
  ],
})

const OTHER_ORDER = makeBuyerOrder({
  orderId: "7a1d5e2c-0b3f-4c8d-9e6a-2f4b6d8a0c1e",
  sellerGroups: [
    makeBuyerOrderSellerGroup({
      sellerId: "seller-other",
      sellerName: "Other",
      sellerSurname: "Seller",
      orderItems: [makeBuyerOrderItem({ id: "item-other", productName: "Unrelated Item" })],
    }),
  ],
})

function registerBuyerOrdersMock(apiMock: ApiMock, recordedUrls: URL[]) {
  apiMock.on("GET", "/backend-api/orders/buyer", ({ url }) => {
    recordedUrls.push(url)
    const orders = url.searchParams.get("orderId") === TARGET_ORDER_ID ? [TARGET_ORDER] : [TARGET_ORDER, OTHER_ORDER]
    return { body: makeBuyerOrdersResponse({ orders, totalElements: orders.length }) }
  })
}

function registerSingleNotification(apiMock: ApiMock, type: string) {
  const notification = makeMockNotification({
    id: "n-deeplink",
    type,
    orderId: TARGET_ORDER_ID,
    title: "Your order was delivered",
    message: "Deep link notification",
  })
  const page = makeMockNotificationsPage({ content: [notification], totalElements: 1, totalPages: 1, unreadCount: 1 })
  apiMock.on("GET", "/backend-api/notifications/unread/count", () => ({ body: { unreadCount: 1 } }))
  apiMock.on("GET", "/backend-api/notifications", () => ({ body: page }))
}

test.describe("Notification → single order deep link", () => {
  test("buyer: bell click filters the orders page to that order, and both exits restore the list", async ({
    buyerPage,
    apiMock,
  }) => {
    const orderRequests: URL[] = []
    registerBuyerOrdersMock(apiMock, orderRequests)
    registerSingleNotification(apiMock, "CUSTOMER_ORDER_DELIVERED")
    registerAllMocks(apiMock)

    await buyerPage.goto("/buyer-dashboard/orders")
    const rows = buyerPage.getByRole("row")
    await expect(rows.filter({ hasText: "Target Seller" })).toBeVisible()
    await expect(rows.filter({ hasText: "Other Seller" })).toBeVisible()

    const notifications = new NotificationsPage(buyerPage)
    await notifications.openBell()
    await notifications.popover.getByTestId("notification-item").filter({ hasText: "Deep link notification" }).click()

    await expect(buyerPage).toHaveURL(new RegExp(`/buyer-dashboard/orders\\?orderId=${TARGET_ORDER_ID}$`))
    await expect(buyerPage.getByRole("status").filter({ hasText: "Showing a single order" })).toBeVisible()
    // Auto-expanded: the open row adds a second "Target Seller" row holding the item list.
    await expect(rows.filter({ hasText: "Target Seller" })).toHaveCount(2)
    await expect(rows.filter({ hasText: "Deep Link Kit" })).toBeVisible()
    await expect(rows.filter({ hasText: "Other Seller" })).toHaveCount(0)
    expect(orderRequests.at(-1)?.searchParams.get("orderId")).toBe(TARGET_ORDER_ID)

    await buyerPage.getByRole("button", { name: "View all orders" }).click()
    await expect(buyerPage).toHaveURL(/\/buyer-dashboard\/orders$/)
    await expect(rows.filter({ hasText: "Other Seller" })).toBeVisible()
    await expect(buyerPage.getByRole("status").filter({ hasText: "Showing a single order" })).toHaveCount(0)
    expect(orderRequests.at(-1)?.searchParams.has("orderId")).toBe(false)

    // The backend ignores `type` while `orderId` is set, so a tab click has to drop it.
    await buyerPage.goto(`/buyer-dashboard/orders?orderId=${TARGET_ORDER_ID}`)
    await expect(rows.filter({ hasText: "Other Seller" })).toHaveCount(0)
    await buyerPage.getByRole("button", { name: "Delivered", exact: true }).click()
    await expect(buyerPage).toHaveURL(/\/buyer-dashboard\/orders\?selectedTab=Delivered$/)
    await expect.poll(() => orderRequests.at(-1)?.searchParams.get("type")).toBe("DELIVERED")
    expect(orderRequests.at(-1)?.searchParams.has("orderId")).toBe(false)
  })

  test("buyer: a non-UUID orderId in the URL is never sent to the backend", async ({ buyerPage, apiMock }) => {
    const orderRequests: URL[] = []
    registerBuyerOrdersMock(apiMock, orderRequests)
    registerAllMocks(apiMock)

    await buyerPage.goto("/buyer-dashboard/orders?orderId=%27%20OR%201%3D1--")
    await expect(buyerPage.getByRole("row").filter({ hasText: "Other Seller" })).toBeVisible()
    await expect(buyerPage.getByRole("status").filter({ hasText: "Showing a single order" })).toHaveCount(0)
    expect(orderRequests.length).toBeGreaterThan(0)
    expect(orderRequests.every((url) => !url.searchParams.has("orderId"))).toBe(true)
  })

  test("vendor: bell click opens the vendor orders page filtered to that order", async ({ vendorPage, apiMock }) => {
    const orderRequests: URL[] = []
    apiMock.on("GET", "/backend-api/orders/seller", ({ url }) => {
      orderRequests.push(url)
      return { body: makeVendorOrdersResponse({ orders: [makeVendorOrder({ orderId: TARGET_ORDER_ID })] }) }
    })
    registerSingleNotification(apiMock, "VENDOR_ORDER_ITEM_CANCELLED")
    registerAllMocks(apiMock)

    await vendorPage.goto("/vendor-dashboard/products")
    const notifications = new NotificationsPage(vendorPage)
    await notifications.openBell()
    await notifications.popover.getByTestId("notification-item").filter({ hasText: "Deep link notification" }).click()

    await expect(vendorPage).toHaveURL(new RegExp(`/vendor-dashboard/orders\\?orderId=${TARGET_ORDER_ID}$`))
    await expect(vendorPage.getByRole("status").filter({ hasText: "Showing a single order" })).toBeVisible()
    await expect.poll(() => orderRequests.at(-1)?.searchParams.get("orderId")).toBe(TARGET_ORDER_ID)

    await vendorPage.getByRole("button", { name: "View all orders" }).click()
    await expect(vendorPage).toHaveURL(/\/vendor-dashboard\/orders$/)
    await expect.poll(() => orderRequests.at(-1)?.searchParams.has("orderId")).toBe(false)
  })

  test("signed-out: the login redirect keeps the orderId so the deep link survives signing in", async ({
    guestPage,
    apiMock,
  }) => {
    registerAllMocks(apiMock)

    await guestPage.goto(`/buyer-dashboard/orders?orderId=${TARGET_ORDER_ID}`)
    await expect(guestPage).toHaveURL(/\/login\?/)
    expect(new URL(guestPage.url()).searchParams.get("redirect")).toBe(
      `/buyer-dashboard/orders?orderId=${TARGET_ORDER_ID}`,
    )
  })
})
