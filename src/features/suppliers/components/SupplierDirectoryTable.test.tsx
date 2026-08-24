import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SupplierDirectoryItem } from "@/features/suppliers/suppliersPageData"
import { render, screen, within } from "@/test/render"
import SupplierDirectoryTable from "./SupplierDirectoryTable"

const makeSupplier = (overrides: Partial<SupplierDirectoryItem> = {}): SupplierDirectoryItem => ({
  id: "vendor-1",
  name: "Acme Dental",
  slug: "acme-dental",
  category: "Supplies",
  location: "New York, NY",
  rating: 4.6,
  reviewCount: 1284,
  productCount: 3400,
  about: "Trusted dental supplies vendor",
  deliveryMethods: ["Courier", "Freight", "Pickup"],
  ...overrides,
})

describe("SupplierDirectoryTable", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("says so instead of rendering an empty table", () => {
    render(<SupplierDirectoryTable suppliers={[]} />)

    expect(screen.getByText("No supplier data available.")).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })

  it("renders a header row and one row per supplier", () => {
    render(<SupplierDirectoryTable suppliers={[makeSupplier(), makeSupplier({ id: "vendor-2", name: "Beta" })]} />)

    expect(screen.getAllByRole("row")).toHaveLength(3)
    for (const header of ["Supplier", "Category", "Location", "Rating", "Delivery", "Actions"]) {
      expect(screen.getByRole("columnheader", { name: header })).toBeInTheDocument()
    }
  })

  it("shows at most two delivery methods per supplier", () => {
    render(<SupplierDirectoryTable suppliers={[makeSupplier()]} />)

    expect(screen.getByText("Courier")).toBeInTheDocument()
    expect(screen.getByText("Freight")).toBeInTheDocument()
    expect(screen.queryByText("Pickup")).not.toBeInTheDocument()
  })

  it("links each row to the catalogue by vendor slug", () => {
    render(<SupplierDirectoryTable suppliers={[makeSupplier()]} />)

    expect(screen.getByRole("link", { name: "View Products" })).toHaveAttribute("href", "/products?vendor=acme-dental")
  })

  it("passes the supplier id to the favourite handler", async () => {
    const user = userEvent.setup()
    const onToggleFavorite = vi.fn()
    render(<SupplierDirectoryTable suppliers={[makeSupplier()]} onToggleFavorite={onToggleFavorite} />)

    await user.click(screen.getByRole("button", { name: "Save to favorites" }))

    expect(onToggleFavorite).toHaveBeenCalledWith("vendor-1")
  })

  it("groups the thousands in the review count", () => {
    render(<SupplierDirectoryTable suppliers={[makeSupplier()]} />)

    const row = screen.getAllByRole("row")[1]
    expect(within(row).getByText("(1,284)")).toBeInTheDocument()
  })
})
