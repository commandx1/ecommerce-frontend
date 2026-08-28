import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { useAuthStore } from "@/stores/authStore"
import { makeAccountUser, makeVendorStockSummaryResponse } from "@/test/factories"
import { render, screen } from "@/test/render"
import InventoryStatus from "./InventoryStatus"

const STOCK_SUMMARY_URL = "*/backend-api/dashboard/vendor/stock-summary"

const signInVendor = () => {
  useAuthStore.setState({
    user: makeAccountUser({ roleName: "Vendor" }),
    accessToken: "token",
    isAuthenticated: true,
  })
}

const serveStockSummary = (body: unknown) => {
  server.use(http.get(STOCK_SUMMARY_URL, () => HttpResponse.json(body as object)))
}

beforeEach(() => {
  signInVendor()
})

describe("InventoryStatus", () => {
  it("shows loading skeletons before the stock summary resolves", () => {
    serveStockSummary(makeVendorStockSummaryResponse())
    const { container } = render(<InventoryStatus />)

    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0)
  })

  it("renders the in-stock, low-stock and out-of-stock counts and percentages from the backend", async () => {
    serveStockSummary(
      makeVendorStockSummaryResponse({
        inStock: { count: 83, percentage: 83.4 },
        lowStock: { count: 12, percentage: 12.1 },
        outOfStock: { count: 5, percentage: 4.5 },
      }),
    )
    render(<InventoryStatus />)

    expect(await screen.findByText("83 products")).toBeInTheDocument()
    expect(screen.getByText("83%")).toBeInTheDocument()
    expect(screen.getByText("12 products")).toBeInTheDocument()
    expect(screen.getByText("5 products")).toBeInTheDocument()
  })

  it("renders each critical stock alert with its remaining count", async () => {
    serveStockSummary(
      makeVendorStockSummaryResponse({
        criticStockAlerts: {
          content: [
            {
              stock: 2,
              name: "Sterile Gauze Pads",
              coverPhotoPath: null,
              manufacturerCode: null,
              skuCode: null,
              userProductId: "up-critical-1",
            },
          ],
          totalPages: 1,
          totalElements: 1,
          last: true,
          first: true,
          numberOfElements: 1,
          size: 3,
          number: 0,
          empty: false,
        },
      }),
    )
    render(<InventoryStatus />)

    expect(await screen.findByText("Sterile Gauze Pads")).toBeInTheDocument()
    expect(screen.getByText("2 left")).toBeInTheDocument()
  })

  it("shows an error message and a Retry button instead of the stock rows when the request fails", async () => {
    server.use(http.get(STOCK_SUMMARY_URL, () => new HttpResponse(null, { status: 400 })))
    render(<InventoryStatus />)

    expect(await screen.findByText("Couldn't load inventory status. Please try again.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument()
    expect(screen.queryByText(/bad request/i)).not.toBeInTheDocument()
    expect(screen.getByText("Inventory Status")).toBeInTheDocument()
  })

  it("re-requests the stock summary and renders the rows after a successful retry", async () => {
    server.use(http.get(STOCK_SUMMARY_URL, () => new HttpResponse(null, { status: 400 })))
    render(<InventoryStatus />)
    await screen.findByText("Couldn't load inventory status. Please try again.")

    serveStockSummary(makeVendorStockSummaryResponse({ inStock: { count: 83, percentage: 83.4 } }))
    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: "Retry" }))

    expect(await screen.findByText("83 products")).toBeInTheDocument()
    expect(screen.queryByText("Couldn't load inventory status. Please try again.")).not.toBeInTheDocument()
  })

  describe("F110 regression: criticStockAlerts.content guard", () => {
    // Before this guard existed, `summary?.criticStockAlerts.content` only checked that
    // `summary` was non-null — a response missing `criticStockAlerts` entirely threw on
    // `.content` and blanked the whole dashboard (TEST-FINDINGS.md F110 / infra note #26).
    it.each([
      ["criticStockAlerts missing entirely", { criticStockAlerts: undefined }],
      ["criticStockAlerts null", { criticStockAlerts: null }],
      ["criticStockAlerts.content missing", { criticStockAlerts: { totalPages: 0 } }],
      ["criticStockAlerts.content null", { criticStockAlerts: { content: null } }],
      ["criticStockAlerts.content not an array", { criticStockAlerts: { content: { name: "x" } } }],
    ])("renders the rest of the panel instead of crashing when %s", async (_label, overrides) => {
      serveStockSummary({ ...makeVendorStockSummaryResponse(), ...overrides })
      render(<InventoryStatus />)

      expect(await screen.findByText("Critical Stock Alerts")).toBeInTheDocument()
      expect(screen.getByText("In Stock")).toBeInTheDocument()
    })
  })

  it.each([
    ["inStock missing entirely", { inStock: undefined }],
    ["lowStock null", { lowStock: null }],
    ["outOfStock missing entirely", { outOfStock: undefined }],
  ])("renders 0 products instead of crashing when %s", async (_label, overrides) => {
    serveStockSummary({ ...makeVendorStockSummaryResponse(), ...overrides })
    render(<InventoryStatus />)

    await screen.findByText("Critical Stock Alerts")
    expect(screen.getAllByText("0 products").length).toBeGreaterThan(0)
  })

  it("does not request stock data for an unauthenticated visitor", async () => {
    useAuthStore.getState().clearAuth()
    let requested = false
    server.use(
      http.get(STOCK_SUMMARY_URL, () => {
        requested = true
        return HttpResponse.json(makeVendorStockSummaryResponse())
      }),
    )
    render(<InventoryStatus />)

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(requested).toBe(false)
  })
})
