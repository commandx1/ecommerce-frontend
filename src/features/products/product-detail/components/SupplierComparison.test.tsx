import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, within } from "@/test/render"
import type { SupplierViewModel } from "../types"
import SupplierComparison from "./SupplierComparison"

const makeSupplier = (overrides: Partial<SupplierViewModel> = {}): SupplierViewModel => ({
  id: 1,
  userProductId: "up-1",
  name: "Acme Dental",
  alt: "Acme Dental logo",
  badge: "Verified",
  price: "$56.00",
  originalPrice: "$70.00",
  discount: 20,
  stock: "In Stock",
  stockColor: "green",
  stockCount: 40,
  shipping: "$5.00",
  shippingNote: "Standard",
  shippingFee: "$5.00",
  heavyShippingFee: "$0.00",
  distance: "12 km",
  distanceTime: "2 days",
  rating: 4.5,
  reviewCount: 12,
  ...overrides,
})

const rowFor = (name: string) => screen.getByText(name).closest("tr")!

describe("SupplierComparison", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("lays the offers out as a comparison table with one row per supplier", () => {
    render(
      <SupplierComparison
        suppliers={[makeSupplier(), makeSupplier({ id: 2, userProductId: "up-2", name: "Beta Supplies" })]}
      />,
    )

    expect(screen.getAllByRole("row")).toHaveLength(3) // header + two suppliers
    for (const header of ["Supplier", "Price", "Stock", "Distance", "Rating", "Action"]) {
      expect(screen.getByRole("columnheader", { name: header })).toBeInTheDocument()
    }
  })

  it("badges only the best-price listing", () => {
    render(
      <SupplierComparison
        suppliers={[makeSupplier(), makeSupplier({ id: 2, userProductId: "up-2", name: "Beta Supplies" })]}
        bestPriceVendorUserProductId="up-2"
      />,
    )

    expect(within(rowFor("Beta Supplies")).getByText("Best Seller")).toBeInTheDocument()
    expect(within(rowFor("Acme Dental")).queryByText("Best Seller")).not.toBeInTheDocument()
  })

  it("breaks shipping into standard, heavy and total", () => {
    render(<SupplierComparison suppliers={[makeSupplier({ heavyShippingFee: "$20.00", shipping: "$25.00" })]} />)

    const row = rowFor("Acme Dental")
    expect(within(row).getByText("$20.00")).toBeInTheDocument()
    expect(within(row).getByText("Total: $25.00")).toBeInTheDocument()
  })

  it("shows a saving badge only while the listing is discounted", () => {
    render(
      <SupplierComparison
        suppliers={[
          makeSupplier(),
          makeSupplier({ id: 2, userProductId: "up-2", name: "Beta Supplies", discount: 0, originalPrice: null }),
        ]}
      />,
    )

    expect(within(rowFor("Acme Dental")).getByText("Save 20%")).toBeInTheDocument()
    expect(within(rowFor("Beta Supplies")).queryByText(/^Save /)).not.toBeInTheDocument()
  })

  it("rounds a fractional discount to one decimal", () => {
    render(<SupplierComparison suppliers={[makeSupplier({ discount: 12.55 })]} />)

    expect(screen.getByText("Save 12.6%")).toBeInTheDocument()
  })

  it("says so when a supplier has no reviews yet", () => {
    render(<SupplierComparison suppliers={[makeSupplier({ reviewCount: 0 })]} />)

    expect(screen.getByText("No reviews yet")).toBeInTheDocument()
  })

  it("falls back to a dash for a supplier with no distance data", () => {
    render(<SupplierComparison suppliers={[makeSupplier({ distance: undefined, distanceTime: undefined })]} />)

    expect(within(rowFor("Acme Dental")).getAllByText("-")).toHaveLength(2)
  })

  it("selects a supplier from its action button", async () => {
    const user = userEvent.setup()
    const onSelectSupplier = vi.fn()
    render(<SupplierComparison suppliers={[makeSupplier()]} onSelectSupplier={onSelectSupplier} />)

    await user.click(screen.getByRole("button", { name: "Select" }))

    expect(onSelectSupplier).toHaveBeenCalledWith(expect.objectContaining({ userProductId: "up-1" }))
  })

  it("marks the active supplier as selected and keeps its button clickable", async () => {
    const user = userEvent.setup()
    const onSelectSupplier = vi.fn()
    render(
      <SupplierComparison suppliers={[makeSupplier()]} selectedSupplierId={1} onSelectSupplier={onSelectSupplier} />,
    )

    const button = screen.getByRole("button", { name: "Selected" })
    await user.click(button)

    expect(onSelectSupplier).toHaveBeenCalledTimes(1)
  })

  it("selects the supplier when the row itself is clicked", async () => {
    const user = userEvent.setup()
    const onSelectSupplier = vi.fn()
    render(<SupplierComparison suppliers={[makeSupplier()]} onSelectSupplier={onSelectSupplier} />)

    await user.click(screen.getByText("Acme Dental"))

    expect(onSelectSupplier).toHaveBeenCalledTimes(1)
  })

  // BULGU: the row is a clickable `<tr>` with an `onClick` but no role, tabindex or key handler —
  // keyboard and screen-reader users can only reach the offer through the Select button.
  it("exposes the clickable row with no interactive role (current behaviour)", () => {
    render(<SupplierComparison suppliers={[makeSupplier()]} onSelectSupplier={vi.fn()} />)

    const row = rowFor("Acme Dental")
    expect(row).not.toHaveAttribute("tabindex")
    expect(row.getAttribute("role")).toBeNull()
  })
})
