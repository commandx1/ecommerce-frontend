import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SupplierDirectoryItem } from "@/features/suppliers/suppliersPageData"
import { render, screen } from "@/test/render"
import SupplierDirectoryCard from "./SupplierDirectoryCard"

const makeSupplier = (overrides: Partial<SupplierDirectoryItem> = {}): SupplierDirectoryItem => ({
  id: "vendor-1",
  name: "Acme Dental",
  slug: "acme-dental",
  rating: 4.6,
  reviewCount: 1284,
  productCount: 3400,
  about: "Trusted dental supplies vendor",
  email: "sales@acmedental.example.com",
  ...overrides,
})

describe("SupplierDirectoryCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("links to the catalogue filtered by that vendor and counts its products", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier()} />)

    const link = screen.getByRole("link", { name: /View 3,400 Products/ })
    expect(link).toHaveAttribute("href", "/products?vendors=vendor-1")
  })

  it("drops the count from the link label for a vendor with no products", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ productCount: 0 })} />)

    expect(screen.getByRole("link", { name: "View Products" })).toBeInTheDocument()
  })

  it("groups the thousands in the review count and shows the rating to one decimal", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier()} />)

    expect(screen.getByText("4.6")).toBeInTheDocument()
    expect(screen.getByText("(1,284 ratings)")).toBeInTheDocument()
  })

  it("offers a mailto link only when the vendor published an address", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier()} />)

    expect(screen.getByRole("link", { name: "Contact supplier" })).toHaveAttribute(
      "href",
      "mailto:sales@acmedental.example.com",
    )
  })

  it("hides the contact action for a vendor with no address", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ email: null })} />)

    expect(screen.queryByRole("link", { name: "Contact supplier" })).not.toBeInTheDocument()
  })

  it("labels the favourite control by what clicking it will do", async () => {
    const user = userEvent.setup()
    const onToggleFavorite = vi.fn()
    render(<SupplierDirectoryCard supplier={makeSupplier({ isFavorite: true })} onToggleFavorite={onToggleFavorite} />)

    await user.click(screen.getByRole("button", { name: "Remove from favorites" }))

    expect(onToggleFavorite).toHaveBeenCalledTimes(1)
  })

  it("omits the location and description lines when the vendor has none", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ about: "", location: undefined })} />)

    expect(screen.queryByText("Trusted dental supplies vendor")).not.toBeInTheDocument()
  })
})
