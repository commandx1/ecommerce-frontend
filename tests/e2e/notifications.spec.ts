import type { ApiMock } from "./fixtures/api-mock.fixture"
import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { type MockNotification, makeMockNotification, makeMockNotificationsPage } from "./mocks/notifications.mocks"
import { NotificationsPage } from "./pages/notifications.page"

/**
 * Three fixture notifications shared by the vendor tests below - `n-1` and
 * `n-2` unread, `n-3` already read (2 unread total). All three share
 * `VENDOR_WAITING_FOR_UBER_DIRECT` + an `orderId` so `resolveNotificationHref`
 * (src/features/notifications/lib/resolve-notification-href.ts) sends a
 * vendor clicking one to `/vendor-dashboard/orders`.
 */
function makeVendorFixtureNotifications(): MockNotification[] {
  return [
    makeMockNotification({
      id: "n-1",
      title: "Order waiting for Uber Direct pickup",
      message: "Order #1001 needs an Uber Direct pickup.",
      orderId: "order-1001",
      read: false,
    }),
    makeMockNotification({
      id: "n-2",
      title: "Order waiting for Uber Direct pickup",
      message: "Order #1002 needs an Uber Direct pickup.",
      orderId: "order-1002",
      read: false,
    }),
    makeMockNotification({
      id: "n-3",
      title: "Order waiting for Uber Direct pickup",
      message: "Order #1003 needs an Uber Direct pickup.",
      orderId: "order-1003",
      read: true,
      readAt: "2026-09-12T09:00:00Z",
    }),
  ]
}

/**
 * Registers stateful notification mock routes on top of the closure-held
 * `notifications` array - mutations (mark read/unread/all) flip `read` on
 * that same array so subsequent GETs reflect them, mirroring how the real
 * backend would behave across the test. Registered BEFORE `registerAllMocks`
 * so these override the static defaults in mocks/notifications.mocks.ts
 * (apiMock resolves to the FIRST matching registered route).
 */
function registerStatefulNotificationMocks(
  apiMock: ApiMock,
  notifications: MockNotification[],
  recordedUrls: string[],
) {
  const unreadCount = () => notifications.filter((n) => !n.read).length

  apiMock.on("GET", "/backend-api/notifications/unread/count", () => ({ body: { unreadCount: unreadCount() } }))

  apiMock.on("GET", "/backend-api/notifications/unread", ({ url }) => {
    recordedUrls.push(url.toString())
    const unread = notifications.filter((n) => !n.read)
    return { body: makeMockNotificationsPage({ content: unread, totalElements: unread.length, size: 20 }) }
  })

  apiMock.on("GET", "/backend-api/notifications", ({ url }) => {
    recordedUrls.push(url.toString())
    const size = Number(url.searchParams.get("size") ?? "20")
    return {
      body: makeMockNotificationsPage({
        content: notifications.slice(0, size),
        totalElements: notifications.length,
        size,
      }),
    }
  })

  apiMock.on("PATCH", "/backend-api/notifications/read-all", () => {
    notifications.forEach((n) => {
      n.read = true
      n.readAt = n.readAt ?? "2026-09-13T12:00:00Z"
    })
    return { body: { updatedCount: notifications.length } }
  })

  apiMock.on("PATCH", "/backend-api/notifications/:id/read", ({ params }) => {
    const found = notifications.find((n) => n.id === params.id)
    if (found) {
      found.read = true
      found.readAt = found.readAt ?? "2026-09-13T12:00:00Z"
    }
    return { body: found ?? makeMockNotification({ id: params.id, read: true }) }
  })

  apiMock.on("PATCH", "/backend-api/notifications/:id/unread", ({ params }) => {
    const found = notifications.find((n) => n.id === params.id)
    if (found) {
      found.read = false
      found.readAt = null
    }
    return { body: found ?? makeMockNotification({ id: params.id, read: false }) }
  })
}

test.describe("notification bell + notifications page - vendor", () => {
  test("bell badge shows the unread count", async ({ vendorPage, apiMock }) => {
    apiMock.on("GET", "/backend-api/notifications/unread/count", () => ({ body: { unreadCount: 2 } }))
    registerAllMocks(apiMock)

    await vendorPage.goto("/vendor-dashboard/products")
    const notifications = new NotificationsPage(vendorPage)

    await expect(notifications.bellButton).toHaveAccessibleName("Notifications, 2 unread")
    await expect(notifications.bellButton).toContainText("2")
  })

  test("popover lists recent notifications and marks all as read", async ({ vendorPage, apiMock }) => {
    const fixtureNotifications = makeVendorFixtureNotifications()
    const recordedUrls: string[] = []
    registerStatefulNotificationMocks(apiMock, fixtureNotifications, recordedUrls)
    registerAllMocks(apiMock)

    await vendorPage.goto("/vendor-dashboard/products")
    const notifications = new NotificationsPage(vendorPage)

    await expect(notifications.bellButton).toHaveAccessibleName("Notifications, 2 unread")
    await notifications.openBell()
    await expect(notifications.popover).toBeVisible()
    await expect(notifications.popover.getByTestId("notification-item")).toHaveCount(3)

    const recentRequest = recordedUrls.find((url) => new URL(url).searchParams.get("size") === "6")
    expect(recentRequest, "expected the bell popover to fetch notifications with size=6").toBeTruthy()

    const readAllRequest = vendorPage.waitForRequest(
      (req) => req.method() === "PATCH" && req.url().includes("/backend-api/notifications/read-all"),
    )
    await notifications.markAllReadButton(notifications.popover).click()
    await readAllRequest

    await expect(notifications.bellButton).toHaveAccessibleName("Notifications")
  })

  test("clicking an unread row marks it read and navigates to the linked order", async ({ vendorPage, apiMock }) => {
    const fixtureNotifications = makeVendorFixtureNotifications()
    registerStatefulNotificationMocks(apiMock, fixtureNotifications, [])
    registerAllMocks(apiMock)

    await vendorPage.goto("/vendor-dashboard/products")
    const notifications = new NotificationsPage(vendorPage)

    await notifications.openBell()
    await expect(notifications.popover).toBeVisible()

    const markReadRequest = vendorPage.waitForRequest(
      (req) => req.method() === "PATCH" && req.url().includes("/backend-api/notifications/n-1/read"),
    )
    await notifications.popover.getByTestId("notification-item").filter({ hasText: "Order #1001" }).click()
    await markReadRequest

    await notifications.expectUrl(/\/vendor-dashboard\/orders/)
  })

  test("full notifications page filters by tab and toggles read state", async ({ vendorPage, apiMock }) => {
    const fixtureNotifications = makeVendorFixtureNotifications()
    registerStatefulNotificationMocks(apiMock, fixtureNotifications, [])
    registerAllMocks(apiMock)

    const notifications = new NotificationsPage(vendorPage)
    await notifications.gotoVendor()

    await expect(notifications.pageHeading).toBeVisible()
    await expect(notifications.items).toHaveCount(3)

    const unreadRequest = vendorPage.waitForRequest(
      (req) => req.method() === "GET" && req.url().includes("/backend-api/notifications/unread"),
    )
    await notifications.tab("Unread").click()
    await unreadRequest
    await expect(notifications.items).toHaveCount(2)

    await notifications.tab("All").click()
    await expect(notifications.items).toHaveCount(3)

    const markUnreadRequest = vendorPage.waitForRequest(
      (req) => req.method() === "PATCH" && req.url().includes("/backend-api/notifications/n-3/unread"),
    )
    await notifications.toggleReadButton("Order #1003").click()
    await markUnreadRequest
  })

  test("pagination requests and renders the next page", async ({ vendorPage, apiMock }) => {
    const pageOneItems = Array.from({ length: 20 }, (_, i) =>
      makeMockNotification({ id: `page1-${i}`, title: `Page one notification ${i}` }),
    )
    const pageTwoItems = [makeMockNotification({ id: "page2-0", title: "Page two notification" })]

    apiMock.on("GET", "/backend-api/notifications", ({ url }) => {
      const page = url.searchParams.get("page") ?? "0"
      if (page === "1") {
        return {
          body: makeMockNotificationsPage({ content: pageTwoItems, page: 1, totalPages: 2, totalElements: 25 }),
        }
      }
      return {
        body: makeMockNotificationsPage({ content: pageOneItems, page: 0, totalPages: 2, totalElements: 25 }),
      }
    })
    registerAllMocks(apiMock)

    const notifications = new NotificationsPage(vendorPage)
    await notifications.gotoVendor()
    await expect(notifications.items).toHaveCount(20)

    const nextPageRequest = vendorPage.waitForRequest(
      (req) =>
        req.method() === "GET" &&
        req.url().includes("/backend-api/notifications") &&
        new URL(req.url()).searchParams.get("page") === "1",
    )
    await notifications.nextPageButton.click()
    await nextPageRequest
    await expect(notifications.items).toHaveCount(1)
  })
})

test.describe("notification bell + notifications page - buyer", () => {
  test("full page shows the empty state and the bell links to it", async ({ buyerPage, apiMock }) => {
    registerAllMocks(apiMock)

    const notifications = new NotificationsPage(buyerPage)
    await notifications.gotoBuyer()

    await expect(notifications.pageHeading).toBeVisible()
    await expect(buyerPage.getByText("No notifications yet")).toBeVisible()

    await notifications.openBell()
    await expect(notifications.popover).toBeVisible()
    await expect(notifications.viewAllLink).toHaveAttribute("href", "/buyer-dashboard/notifications")
  })
})
