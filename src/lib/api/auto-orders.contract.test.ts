import { HttpResponse, http } from "msw"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest"
import { autoOrdersAPI, type UpdateAutoOrderPayload } from "./auto-orders"

const mockListResponse = {
  autoOrders: [
    {
      id: "584aa69c-10b5-4911-952a-4d33d298f23d",
      userProductId: "63fb93ae-b6e2-4c3f-918c-69b9653a83ab",
      productId: "1cb0d772-718b-4f24-9a90-6956be185e16",
      productName: "New POLO RED by Ralph Lauren - Type: Fragrances",
      productCoverPhotoPath: "/uploads/productCoverPhoto/1577afd9-cover.jpg",
      price: 80,
      quantity: 2,
      period: "TWO_MONTHS",
      nextOrderDate: "2026-10-14T18:06:14.835534",
      active: true,
      sellerName: "Enis Atay",
      createdDate: "2026-08-15T18:06:15.634535",
      updatedDate: "2026-08-15T18:06:15.634559",
    },
    {
      id: "523f26c3-4d1a-4323-b88e-2c5453c30020",
      userProductId: "4361aad4-8050-423f-a248-3e4acfe8f29a",
      productId: "6c4c4a0b-0352-4430-b5fe-c40e3f31a163",
      productName: "Intra Oral Mixing Tips Yellow 100/Pk - MARK3",
      productCoverPhotoPath: "https://nobledentalsupplies.imgix.net/content/images/thumbs/0005834.png",
      price: 56,
      quantity: 2,
      period: "TWO_WEEKS",
      nextOrderDate: "2026-08-30T18:06:14.835534",
      active: true,
      sellerName: "Mustafa Enis Atay",
      createdDate: "2026-08-15T18:06:15.005471",
      updatedDate: "2026-08-15T18:06:15.005545",
    },
  ],
  total: 2,
}

const mockUpdateResponse = {
  ...mockListResponse.autoOrders[0],
  id: "3b948d0f-7401-41e9-93d5-74fc0c58bb10",
  quantity: 10,
  period: "TWO_WEEKS",
  nextOrderDate: "2026-08-31T09:47:37.9055",
  active: false,
  updatedDate: "2026-08-15T18:48:42.708851",
}

let capturedUpdatePayload: UpdateAutoOrderPayload | null = null
let capturedDeleteUrl: string | null = null

const server = setupServer(
  http.get("*/backend-api/auto-orders", () => HttpResponse.json(mockListResponse)),
  http.patch("*/backend-api/auto-orders/:autoOrderId", async ({ request }) => {
    capturedUpdatePayload = (await request.json()) as UpdateAutoOrderPayload
    return HttpResponse.json(mockUpdateResponse)
  }),
  http.delete("*/backend-api/auto-orders/:autoOrderId", ({ request }) => {
    capturedDeleteUrl = request.url
    return new HttpResponse(null, { status: 204 })
  }),
)

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" })
})

afterEach(() => {
  capturedUpdatePayload = null
  capturedDeleteUrl = null
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

describe("autoOrdersAPI contract", () => {
  it("returns the typed auto order list", async () => {
    const response = await autoOrdersAPI.getAutoOrders()

    expect(response.total).toBe(2)
    expect(response.autoOrders).toHaveLength(2)
    expect(response.autoOrders[0]?.period).toBe("TWO_MONTHS")
    expect(response.autoOrders[0]?.active).toBe(true)
    expect(response.autoOrders[1]?.productCoverPhotoPath).toContain("https://")
  })

  it("sends only the fields being changed and returns the updated auto order", async () => {
    const payload: UpdateAutoOrderPayload = { quantity: 10, active: false, period: "TWO_WEEKS" }
    const response = await autoOrdersAPI.updateAutoOrder("3b948d0f-7401-41e9-93d5-74fc0c58bb10", payload)

    expect(capturedUpdatePayload).toEqual(payload)
    expect(response.quantity).toBe(10)
    expect(response.active).toBe(false)
    expect(response.period).toBe("TWO_WEEKS")
    // Changing the period restarts the countdown from now
    expect(response.nextOrderDate).toBe("2026-08-31T09:47:37.9055")
  })

  it("supports a partial update", async () => {
    await autoOrdersAPI.updateAutoOrder("3b948d0f-7401-41e9-93d5-74fc0c58bb10", { active: true })

    expect(capturedUpdatePayload).toEqual({ active: true })
  })

  it("deletes by id", async () => {
    await autoOrdersAPI.deleteAutoOrder("584aa69c-10b5-4911-952a-4d33d298f23d")

    expect(capturedDeleteUrl).toContain("/auto-orders/584aa69c-10b5-4911-952a-4d33d298f23d")
  })

  it("rejects when the backend returns an error status", async () => {
    server.use(
      http.patch("*/backend-api/auto-orders/:autoOrderId", () =>
        HttpResponse.json(
          {
            message:
              "You need a saved card that is selected for auto orders and open to automatic payments before activating an auto order.",
          },
          { status: 400 },
        ),
      ),
    )

    await expect(autoOrdersAPI.updateAutoOrder("any-id", { active: true })).rejects.toBeDefined()
  })
})
