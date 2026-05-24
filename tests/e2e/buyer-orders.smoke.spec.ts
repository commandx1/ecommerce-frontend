import { expect, test } from "@playwright/test"

const buyerOrdersResponse = {
  orders: [
    {
      orderId: "order-1",
      totalPrice: 240,
      orderStatus: "PAID",
      createdDate: "2026-05-20T10:30:00Z",
      addressTitle: "Home",
      addressFormattedAddress: "Bagdat Caddesi 10, Kadikoy / Istanbul",
      shipmentAddress: {
        title: "Home",
        fullName: "Jane Doe",
        phoneNumber: "5551234567",
        country: "TR",
        city: "Istanbul",
        district: "Kadikoy",
        postalCode: "34000",
        addressLine: "Bagdat Caddesi 10",
        formattedAddress: "Bagdat Caddesi 10, Kadikoy / Istanbul",
        latitude: 0,
        longitude: 0,
        placeId: "place-1",
      },
      cardName: "Jane Doe",
      cardBrand: "visa",
      cardLast4: "4242",
      cardExpMonth: 12,
      cardExpYear: 2030,
      sellerGroups: [
        {
          sellerId: "seller-1",
          sellerName: "Acme",
          sellerSurname: "Store",
          orderItems: [
            {
              id: "item-1",
              userProductId: "up-1",
              productId: "product-1",
              productName: "Dental Kit",
              price: 100,
              quantity: 2,
              status: "WAITING_FOR_SHIPMENT",
              productCoverPhotoPath: null,
              sellerName: "Acme",
              sellerSurname: "Store",
              shipmentPrice: 5,
              shipmentFreeBySeller: false,
              trackingLinks: [
                {
                  trackingUrl: "https://track.example/1",
                  status: "IN_TRANSIT",
                  updatedDate: "2026-05-20T11:00:00Z",
                },
              ],
              updatedDate: "2026-05-20T11:00:00Z",
            },
            {
              id: "item-2",
              userProductId: "up-2",
              productId: "product-2",
              productName: "Toothpaste",
              price: 30,
              quantity: 1,
              status: "DELIVERED",
              productCoverPhotoPath: null,
              sellerName: "Acme",
              sellerSurname: "Store",
              shipmentPrice: 0,
              shipmentFreeBySeller: true,
              updatedDate: "2026-05-20T11:10:00Z",
            },
          ],
        },
      ],
    },
  ],
  currentPage: 0,
  totalPages: 1,
  totalElements: 1,
  pageSize: 10,
}

test.beforeEach(async ({ context, page }) => {
  await context.addCookies([
    {
      name: "auth-storage",
      value: encodeURIComponent(
        JSON.stringify({
          state: {
            user: {
              id: "user-1",
              name: "Jane",
              surname: "Doe",
              email: "jane@example.com",
              phoneNumber: "5551234567",
              emailConfirmed: true,
              phoneNumberConfirmed: true,
              twoFactorEnabled: false,
              lockoutEnd: null,
              createdDate: "2026-01-01T00:00:00Z",
            },
            accessToken: "test-token",
            refreshToken: "test-refresh",
            isAuthenticated: true,
            isAdminImpersonating: false,
          },
          version: 0,
        }),
      ),
      url: "http://localhost:3000",
    },
  ])

  await page.route("**/backend-api/**", async (route) => {
    const requestUrl = new URL(route.request().url())

    if (requestUrl.pathname.endsWith("/orders/buyer")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(buyerOrdersResponse),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({}),
    })
  })
})

test("renders buyer orders table and expanded order details from API response", async ({ page }) => {
  await page.goto("/buyer-dashboard/orders")

  await expect(page.getByRole("heading", { name: "Your Orders" })).toBeVisible()

  await expect(page.getByRole("columnheader", { name: "Date" })).toBeVisible()
  await expect(page.getByRole("columnheader", { name: "Seller / Store" })).toBeVisible()
  await expect(page.getByRole("columnheader", { name: "Items" })).toBeVisible()
  await expect(page.getByRole("columnheader", { name: "Payment Method" })).toBeVisible()
  await expect(page.getByRole("columnheader", { name: "Payment Status" })).toBeVisible()
  await expect(page.getByRole("columnheader", { name: "Shipment Status" })).toBeVisible()
  await expect(page.getByRole("columnheader", { name: "Tracking" })).toBeVisible()
  await expect(page.getByRole("columnheader", { name: "Net Total" })).toBeVisible()
  await expect(page.getByRole("columnheader", { name: "Shipment Fee" })).toBeVisible()

  await expect(page.getByText("Acme Store")).toBeVisible()
  await expect(page.getByText("3 items")).toBeVisible()
  await expect(page.getByText("VISA •••• 4242")).toBeVisible()
  await expect(page.getByText("Paid")).toBeVisible()
  await expect(page.getByText("1 link")).toBeVisible()
  await expect(page.getByText("$240.00")).toBeVisible()
  await expect(page.getByText("$10.00")).toBeVisible()

  await page.locator("tbody tr").first().getByRole("button").click()

  await expect(page.getByRole("heading", { name: "Order Items" })).toBeVisible()
  await expect(page.getByText("Dental Kit")).toBeVisible()
  await expect(page.getByText("Toothpaste")).toBeVisible()
  await expect(page.getByText("Customer Details")).toBeVisible()
  await expect(page.getByText("Fulfillment").first()).toBeVisible()
  await expect(page.getByRole("button", { name: "Reorder" }).first()).toBeVisible()
  await expect(page.getByRole("button", { name: "Track" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Cancel Item" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Cancel All Items from Acme Store" })).toBeVisible()
})
