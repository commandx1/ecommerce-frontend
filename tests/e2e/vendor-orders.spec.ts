import { makeVendorOrder, makeVendorOrderItem, makeVendorOrdersResponse } from "@/test/factories/order.factory"
import { expect, test } from "./fixtures/auth.fixture"
import { registerAllMocks } from "./mocks"
import { VendorOrdersPage } from "./pages/vendor-orders.page"

/**
 * "Call Uber" only enables when an order has an item in WAITING_FOR_UBER_DIRECT
 * / UBER_ERROR (handleCallUber, page.tsx); "Track / Labels" only renders when
 * an item has shippingLinks/trackingLinks (order-expanded-content.tsx). The
 * default factories don't set either, so this spec overrides the seller
 * orders response with data shaped for each scenario.
 */
const ordersWithUberAndLabels = makeVendorOrdersResponse({
  orders: [
    makeVendorOrder({
      orderId: "vorder-uber",
      orderItems: [
        makeVendorOrderItem({
          id: "vitem-uber",
          status: "WAITING_FOR_UBER_DIRECT",
        }),
      ],
    }),
    makeVendorOrder({
      orderId: "vorder-labels",
      orderItems: [
        makeVendorOrderItem({
          id: "vitem-labels",
          status: "WAITING_FOR_SHIPMENT",
          shippingLinks: [{ shippingUrl: "https://labels.example.com/label-1.pdf", shipmentPrice: 5 }],
          trackingLinks: [
            { trackingUrl: "https://track.example.com/1", status: "IN_TRANSIT", updatedDate: "2026-05-20T11:00:00Z" },
          ],
        }),
      ],
    }),
  ],
  totalElements: 2,
})

/** Minimal fake QZ Tray API - records every print() call instead of talking to a real printer. */
const FAKE_QZ_INIT_SCRIPT = `
  window.__qzPrintCalls = [];
  window.qz = {
    websocket: { isActive: () => true, connect: async () => {} },
    printers: { find: async () => ["Fake Printer"] },
    configs: { create: (printer, options) => ({ printer, options }) },
    print: async (config, data) => { window.__qzPrintCalls.push({ config, data }); },
    api: { getVersion: async () => "test-2.0" },
  };
`

test.describe("vendor orders", () => {
  test("order list renders seller orders", async ({ vendorPage, apiMock }) => {
    registerAllMocks(apiMock)

    const orders = new VendorOrdersPage(vendorPage)
    await orders.goto()
    await expect(orders.mainHeading).toBeVisible()
  })

  test("Call Uber sends process-deliveries and shows the result panel", async ({ vendorPage, apiMock }) => {
    apiMock.on("GET", "/backend-api/orders/seller", () => ({ body: ordersWithUberAndLabels }))
    registerAllMocks(apiMock)

    const orders = new VendorOrdersPage(vendorPage)
    await orders.goto()

    const uberRequest = vendorPage.waitForRequest(
      (req) => req.method() === "POST" && req.url().includes("/backend-api/orders/uber/process-deliveries"),
    )
    await orders.callUberButtons.first().click()
    const request = await uberRequest
    const body = request.postDataJSON() as { orderItemIds: string[] }
    expect(body.orderItemIds).toContain("vitem-uber")

    await expect(orders.uberResultHeading).toBeVisible()
  })

  test("cancel item confirmation modal sends cancelBySeller with the item id", async ({ vendorPage, apiMock }) => {
    apiMock.on("GET", "/backend-api/orders/seller", () => ({ body: ordersWithUberAndLabels }))
    registerAllMocks(apiMock)

    const orders = new VendorOrdersPage(vendorPage)
    await orders.goto()
    // Row 1 = vorder-labels (WAITING_FOR_SHIPMENT item, cancelable) - see
    // isCancelableOrderItemStatus / ShippoCancelableStatus.WAITING_FOR_SHIPMENT.
    await orders.expandOrderRow(1)

    await orders.cancelItemButtons.first().click()
    await expect(vendorPage.getByText("Confirm cancellation")).toBeVisible()

    const cancelRequest = vendorPage.waitForRequest(
      (req) => req.method() === "POST" && req.url().includes("/backend-api/orders/cancelBySeller"),
    )
    await orders.confirmCancelButton.click()
    const request = await cancelRequest
    const body = request.postDataJSON() as { orderItemIds: string[] }
    expect(body.orderItemIds.length).toBeGreaterThan(0)

    await expect(vendorPage.locator("[data-sonner-toaster] li[data-sonner-toast]")).toContainText("Cancellation sent")
  })

  test("printing a shipping label calls the injected QZ Tray API with the label URL", async ({
    vendorPage,
    apiMock,
  }) => {
    apiMock.on("GET", "/backend-api/orders/seller", () => ({ body: ordersWithUberAndLabels }))
    registerAllMocks(apiMock)

    // Must run before any page script executes, including the QZ script-load
    // attempt in src/lib/qz/printLabel.ts (isQzApi(window.qz) short-circuits it).
    await vendorPage.addInitScript(FAKE_QZ_INIT_SCRIPT)

    const orders = new VendorOrdersPage(vendorPage)
    await orders.goto()
    await orders.expandOrderRow(1)

    await orders.trackLabelsButtons.first().click()
    await expect(vendorPage.getByText("Labels & tracking")).toBeVisible()

    await orders.printLabelButtons.first().click()

    await expect
      .poll(async () =>
        vendorPage.evaluate(() => (window as unknown as { __qzPrintCalls: unknown[] }).__qzPrintCalls.length),
      )
      .toBe(1)

    const calls = await vendorPage.evaluate(
      () =>
        (window as unknown as { __qzPrintCalls: Array<{ data: Array<{ type: string; data: string }> }> })
          .__qzPrintCalls,
    )
    expect(calls[0].data[0]).toMatchObject({ type: "pdf", data: "https://labels.example.com/label-1.pdf" })
  })
})
