import {
  makeBuyerOrder,
  makeBuyerOrderItem,
  makeBuyerOrderSellerGroup,
  makeBuyerOrdersResponse,
  makeCancelDuringDeliveryByCustomerResponse,
  makeRefundOrderResponse,
} from "@/test/factories/order.factory"
import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { BuyerOrdersPage } from "./pages/buyer-orders.page"

/**
 * Buyer-side cancel (item 8) and return/refund (item 2) journeys on
 * /buyer-dashboard/orders. buyer-orders.smoke.spec.ts only asserted the
 * "Cancel Item"/"Cancel All Items from" buttons are *visible* - it never
 * actually drove either flow to a request. Endpoints and DTOs, verified
 * against ecommerce-api:
 *  - `POST /orders/cancelDuringDeliveryByCustomer` -> OrderController#cancelDuringDeliveryByCustomer,
 *    request body is a flat `{ orderItemIds: string[] }` (CancelDuringDeliveryByCustomerRequest).
 *  - `POST /orders/refundOrder` -> OrderController#refundOrder, response is
 *    `RefundOrderResponse` (message, successCount, failureCount, transactionId,
 *    shippingPrice, orderItemIds, itemLinks) - see src/lib/api/buyer-orders.ts's
 *    doc-comment on `RefundOrderResponse` for why it's all-or-nothing.
 * Both response factories (makeCancelDuringDeliveryByCustomerResponse,
 * makeRefundOrderResponse) already exist in @/test/factories/order.factory.ts and are
 * reused here instead of hand-rolling new fixture shapes.
 */
test.use({ viewport: { width: 1280, height: 900 } })

test.describe("buyer order cancel", () => {
  test("canceling a pre-shipment item sends the request and flips its status to Cancel Requested", async ({
    buyerPage,
    apiMock,
  }) => {
    const order = makeBuyerOrder({
      orderId: "order-cancel-1",
      sellerGroups: [
        makeBuyerOrderSellerGroup({
          sellerId: "seller-1",
          sellerName: "Acme",
          sellerSurname: "Store",
          orderItems: [
            makeBuyerOrderItem({
              id: "item-1",
              productName: "Dental Kit",
              quantity: 2,
              status: "WAITING_FOR_SHIPMENT",
            }),
          ],
        }),
      ],
    })
    apiMock.on("GET", "/backend-api/orders/buyer", () => ({ body: makeBuyerOrdersResponse({ orders: [order] }) }))
    apiMock.on("POST", "/backend-api/orders/cancelDuringDeliveryByCustomer", () => ({
      body: makeCancelDuringDeliveryByCustomerResponse({ cancelledOrderItemIds: ["item-1"] }),
    }))
    registerAllMocks(apiMock)

    const orders = new BuyerOrdersPage(buyerPage)
    await orders.goto()
    await expect(buyerPage.getByText("Acme Store").first()).toBeVisible()
    await orders.expandFirstRow()

    await expect(buyerPage.getByText("Dental Kit").first()).toBeVisible()
    await expect(orders.cancelItemButton()).toBeVisible()

    const cancelRequest = buyerPage.waitForRequest(
      (request) =>
        request.method() === "POST" && request.url().endsWith("/backend-api/orders/cancelDuringDeliveryByCustomer"),
    )
    await orders.cancelItemButton().click()
    await expect(buyerPage.getByText("Confirm cancellation")).toBeVisible()
    await orders.confirmCancelButton.click()

    const request = await cancelRequest
    expect(request.postDataJSON()).toEqual({ orderItemIds: ["item-1"] })

    await expect(orders.toast).toContainText("Cancellation sent")
    // markItemsCancelRequested (order-patches.ts) flips the item's status client-side - the badge
    // updates and the now-ineligible "Cancel Item" button disappears without a second GET.
    await expect(buyerPage.getByText("Cancel Requested").filter({ visible: true })).toBeVisible()
    await expect(orders.cancelItemButton()).toHaveCount(0)
  })

  test("Keep order closes the confirmation modal without sending a request", async ({ buyerPage, apiMock }) => {
    const order = makeBuyerOrder({
      orderId: "order-cancel-2",
      sellerGroups: [
        makeBuyerOrderSellerGroup({
          orderItems: [makeBuyerOrderItem({ id: "item-1", productName: "Dental Kit", status: "WAITING_FOR_SHIPMENT" })],
        }),
      ],
    })
    apiMock.on("GET", "/backend-api/orders/buyer", () => ({ body: makeBuyerOrdersResponse({ orders: [order] }) }))
    registerAllMocks(apiMock)

    const orders = new BuyerOrdersPage(buyerPage)
    await orders.goto()
    await orders.expandFirstRow()

    await orders.cancelItemButton().click()
    await expect(buyerPage.getByText("Confirm cancellation")).toBeVisible()
    await orders.keepOrderButton.click()

    await expect(buyerPage.getByText("Confirm cancellation")).toBeHidden()
    // Item is still cancelable - the button is back, nothing changed server-side.
    await expect(orders.cancelItemButton()).toBeVisible()
  })
})

test.describe("buyer order return/refund", () => {
  test("requesting a return sends the refund payload and marks the item Return Pending", async ({
    buyerPage,
    apiMock,
  }) => {
    const order = makeBuyerOrder({
      orderId: "order-refund-1",
      sellerGroups: [
        makeBuyerOrderSellerGroup({
          sellerId: "seller-1",
          sellerName: "Acme",
          sellerSurname: "Store",
          orderItems: [
            makeBuyerOrderItem({
              id: "item-1",
              productName: "Dental Kit",
              quantity: 3,
              status: "DELIVERED",
              returnenable: true,
            }),
          ],
        }),
      ],
    })
    apiMock.on("GET", "/backend-api/orders/buyer", () => ({ body: makeBuyerOrdersResponse({ orders: [order] }) }))
    apiMock.on("POST", "/backend-api/orders/refundOrder", () => ({
      body: makeRefundOrderResponse({ orderItemIds: ["item-1"] }),
    }))
    registerAllMocks(apiMock)

    const orders = new BuyerOrdersPage(buyerPage)
    await orders.goto()
    await orders.expandFirstRow()

    await expect(orders.requestReturnButton()).toBeVisible()
    await orders.requestReturnButton().click()
    await expect(orders.refundModalHeading).toBeVisible()

    // The single refundable item is preselected (see refund-order-modal.test.tsx's identical rule) -
    // only the reason still needs to be picked.
    await orders.returnReasonSelect().click()
    await buyerPage.getByRole("option", { name: "Product Arrived Damaged" }).click()

    const refundRequest = buyerPage.waitForRequest(
      (request) => request.method() === "POST" && request.url().endsWith("/backend-api/orders/refundOrder"),
    )
    await orders.submitRefundButton.click()
    const request = await refundRequest
    expect(request.postDataJSON()).toEqual({
      items: [{ orderItemId: "item-1", quantity: 1, returnReason: "Product Arrived Damaged" }],
    })

    await expect(orders.toast).toContainText("Return request sent")
    // applyRefundSubmitted (order-patches.ts) sets refundStatus/returnRefundStatus to PENDING and
    // returnDate client-side - the row's status tag flips to "Return Pending" and, since
    // canRequestItemReturn now sees a non-empty returnDate, the trigger button disappears too.
    await expect(buyerPage.getByText("Return Pending").filter({ visible: true })).toBeVisible()
    await expect(orders.requestReturnButton()).toHaveCount(0)
  })

  test("an item that is not return-eligible shows no Request Return action", async ({ buyerPage, apiMock }) => {
    const order = makeBuyerOrder({
      orderId: "order-refund-2",
      sellerGroups: [
        makeBuyerOrderSellerGroup({
          sellerId: "seller-1",
          sellerName: "Acme",
          sellerSurname: "Store",
          orderItems: [
            makeBuyerOrderItem({
              id: "item-eligible",
              productName: "Dental Kit",
              status: "DELIVERED",
              returnenable: true,
            }),
            makeBuyerOrderItem({
              id: "item-ineligible",
              productName: "Toothpaste",
              status: "DELIVERED",
              returnenable: false,
            }),
          ],
        }),
      ],
    })
    apiMock.on("GET", "/backend-api/orders/buyer", () => ({ body: makeBuyerOrdersResponse({ orders: [order] }) }))
    registerAllMocks(apiMock)

    const orders = new BuyerOrdersPage(buyerPage)
    await orders.goto()
    await orders.expandFirstRow()

    await expect(buyerPage.getByText("Toothpaste").first()).toBeVisible()
    // Exactly one "Request Return" button - the DELIVERED-but-not-returnenable item gets none.
    await expect(orders.requestReturnButton()).toHaveCount(1)
  })
})
