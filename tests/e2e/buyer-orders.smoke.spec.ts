import {
  makeBuyerOrder,
  makeBuyerOrderItem,
  makeBuyerOrderSellerGroup,
  makeBuyerOrdersResponse,
} from "@/test/factories/order.factory"
import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { BuyerOrdersPage } from "./pages/buyer-orders.page"

/**
 * /buyer-dashboard/orders smoke test - rewritten on top of the Faz 8.1/8.2
 * infra (buyerPage + apiMock + registerAllMocks + BuyerOrdersPage), dropping
 * the pre-migration inline cookie and inline `page.route("**\/backend-api/**")`
 * catch-all this file used to hand-roll.
 *
 * FINDING (test-authoring bug in the OLD version of this file, not a product
 * bug): the previous assertions checked for "Payment Method", "Payment
 * Status", "Shipment Status" and "Tracking" *columns*. OrdersTable
 * (src/app/buyer-dashboard/orders/components/orders-table.tsx) has never had
 * those columns - the real ones are Date, Seller / Store, Items, Net Total,
 * Shipment Fee, plus an unlabeled trailing expander column. Those old
 * assertions could only have been passing against role="columnheader"
 * matching partial/looser text, or were never actually run since being
 * written - either way they've been replaced with the real columns below.
 * `npm run test:smoke` depends on this filename staying the same.
 *
 * Viewport: this spec targets the desktop `OrdersTable` (the columns/rows
 * the task asked for) specifically, not `OrdersMobileList` - the sibling
 * `md:hidden` card list rendered on narrow viewports
 * (src/app/buyer-dashboard/orders/page.tsx toggles between them purely via
 * Tailwind's `md:` breakpoint, i.e. viewport width). `npm run test:smoke`
 * runs every configured project, including a narrow `mobile-chrome` one
 * (playwright.config.ts) where `OrdersTable` is CSS-hidden and none of these
 * column/table assertions would ever find anything - so this file pins a
 * desktop-width viewport regardless of project so the table (not the card
 * list) is what's actually exercised everywhere it runs.
 */
test.use({ viewport: { width: 1280, height: 900 } })

const TWO_ITEM_ORDER = makeBuyerOrder({
  orderId: "order-1",
  totalPrice: 245,
  orderStatus: "PAID",
  createdDate: "2026-05-20T10:30:00Z",
  sellerGroups: [
    makeBuyerOrderSellerGroup({
      sellerId: "seller-1",
      sellerName: "Acme",
      sellerSurname: "Store",
      orderItems: [
        makeBuyerOrderItem({
          id: "item-1",
          userProductId: "up-1",
          productId: "product-1",
          productName: "Dental Kit",
          price: 100,
          quantity: 2,
          status: "WAITING_FOR_SHIPMENT",
          shipmentPrice: 5,
          shipmentFreeBySeller: false,
        }),
        makeBuyerOrderItem({
          id: "item-2",
          userProductId: "up-2",
          productId: "product-2",
          productName: "Toothpaste",
          price: 30,
          quantity: 1,
          status: "DELIVERED",
          shipmentPrice: 0,
          shipmentFreeBySeller: true,
        }),
      ],
    }),
  ],
})

test.describe("buyer orders smoke", () => {
  test("renders the orders table with the real columns and expanded order details", async ({ buyerPage, apiMock }) => {
    apiMock.on("GET", "/backend-api/orders/buyer", () => ({
      body: makeBuyerOrdersResponse({ orders: [TWO_ITEM_ORDER] }),
    }))
    registerAllMocks(apiMock)

    const orders = new BuyerOrdersPage(buyerPage)
    await orders.goto()

    await expect(buyerPage.getByRole("heading", { name: "Your Orders" })).toBeVisible()

    await expect(orders.dateColumnHeader).toBeVisible()
    await expect(orders.sellerColumnHeader).toBeVisible()
    await expect(orders.itemsColumnHeader).toBeVisible()
    await expect(orders.netTotalColumnHeader).toBeVisible()
    await expect(orders.shipmentFeeColumnHeader).toBeVisible()
    // No Payment Method/Payment Status/Shipment Status/Tracking columns exist.
    await expect(buyerPage.getByRole("columnheader", { name: "Payment Method" })).toHaveCount(0)
    await expect(buyerPage.getByRole("columnheader", { name: "Payment Status" })).toHaveCount(0)
    await expect(buyerPage.getByRole("columnheader", { name: "Shipment Status" })).toHaveCount(0)
    await expect(buyerPage.getByRole("columnheader", { name: "Tracking" })).toHaveCount(0)

    await expect(buyerPage.getByText("Acme Store").first()).toBeVisible()
    await expect(buyerPage.getByText("3 items", { exact: true }).first()).toBeVisible()
    await expect(buyerPage.getByText("$245.00").first()).toBeVisible()
    // Shipment fee column: item-1's 5.00 * qty 2 = 10.00, item-2 is seller-free.
    await expect(buyerPage.getByText("$10.00").first()).toBeVisible()

    await orders.expandFirstRow()

    await expect(orders.orderItemsHeading).toBeVisible()
    await expect(buyerPage.getByText("Dental Kit").first()).toBeVisible()
    await expect(buyerPage.getByText("Toothpaste").first()).toBeVisible()
    await expect(orders.customerDetailsHeading).toBeVisible()
    await expect(orders.reorderButton()).toBeVisible()
    await expect(orders.cancelItemButton()).toBeVisible()
    await expect(orders.cancelAllFromSellerButton("Acme Store")).toBeVisible()
  })

  test("switching a status tab requests the matching `type` filter and re-fetches orders", async ({
    buyerPage,
    apiMock,
  }) => {
    apiMock.on("GET", "/backend-api/orders/buyer", ({ url }) => {
      const type = url.searchParams.get("type")
      if (type === "DELIVERED") {
        return {
          body: makeBuyerOrdersResponse({
            orders: [
              makeBuyerOrder({
                orderId: "order-delivered",
                orderStatus: "DELIVERED",
                sellerGroups: [
                  makeBuyerOrderSellerGroup({
                    sellerId: "seller-2",
                    sellerName: "Beta",
                    sellerSurname: "Dental",
                    orderItems: [makeBuyerOrderItem({ status: "DELIVERED" })],
                  }),
                ],
              }),
            ],
          }),
        }
      }
      return { body: makeBuyerOrdersResponse({ orders: [TWO_ITEM_ORDER] }) }
    })
    registerAllMocks(apiMock)

    const orders = new BuyerOrdersPage(buyerPage)
    await orders.goto()
    await expect(buyerPage.getByText("Acme Store").first()).toBeVisible()

    const deliveredRequest = buyerPage.waitForRequest(
      (request) =>
        request.method() === "GET" &&
        request.url().includes("/backend-api/orders/buyer") &&
        new URL(request.url()).searchParams.get("type") === "DELIVERED",
    )
    await orders.statusTab("Delivered").click()
    await deliveredRequest

    await expect(buyerPage.getByText("Acme Store").first()).toBeHidden()
  })

  test("renders pagination controls driven by the API's page metadata", async ({ buyerPage, apiMock }) => {
    apiMock.on("GET", "/backend-api/orders/buyer", () => ({
      body: makeBuyerOrdersResponse({
        orders: [TWO_ITEM_ORDER],
        currentPage: 0,
        totalPages: 3,
        totalElements: 25,
        pageSize: 10,
      }),
    }))
    registerAllMocks(apiMock)

    const orders = new BuyerOrdersPage(buyerPage)
    await orders.goto()
    await expect(buyerPage.getByText("Acme Store").first()).toBeVisible()

    await expect(orders.nextPageButton).toBeVisible()

    const page2Request = buyerPage.waitForRequest(
      (request) =>
        request.method() === "GET" &&
        request.url().includes("/backend-api/orders/buyer") &&
        new URL(request.url()).searchParams.get("page") === "1",
    )
    await orders.nextPageButton.click()
    await page2Request
  })
})
