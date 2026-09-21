import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SupplierDirectoryItem } from "@/features/suppliers/suppliersPageData"
import { render, screen } from "@/test/render"
import SupplierDirectoryCard from "./SupplierDirectoryCard"

const makeSupplier = (overrides: Partial<SupplierDirectoryItem> = {}): SupplierDirectoryItem => ({
  // id is a company id (one card per company) - see SuppliersDirectorySection's
  // "one card per company" regression test.
  id: "company-1",
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
    expect(link).toHaveAttribute("href", "/products?vendors=company-1")
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

  it("labels the favourite control by what clicking it will do", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ isFavorite: true })} />)

    expect(screen.getByRole("button", { name: "Remove from favorites" })).toBeInTheDocument()
  })

  it("adds a favourite immediately with a single click", async () => {
    const user = userEvent.setup()
    const onToggleFavorite = vi.fn()
    render(<SupplierDirectoryCard supplier={makeSupplier({ isFavorite: false })} onToggleFavorite={onToggleFavorite} />)

    await user.click(screen.getByRole("button", { name: "Save to favorites" }))

    expect(onToggleFavorite).toHaveBeenCalledTimes(1)
    expect(screen.queryByText("Remove from favorites?")).not.toBeInTheDocument()
  })

  it("asks for confirmation before removing a favourite", async () => {
    const user = userEvent.setup()
    const onToggleFavorite = vi.fn()
    render(<SupplierDirectoryCard supplier={makeSupplier({ isFavorite: true })} onToggleFavorite={onToggleFavorite} />)

    await user.click(screen.getByRole("button", { name: "Remove from favorites" }))

    expect(screen.getByText("Remove from favorites?")).toBeInTheDocument()
    expect(onToggleFavorite).not.toHaveBeenCalled()
  })

  it("removes the favourite only after confirming", async () => {
    const user = userEvent.setup()
    const onToggleFavorite = vi.fn()
    render(<SupplierDirectoryCard supplier={makeSupplier({ isFavorite: true })} onToggleFavorite={onToggleFavorite} />)

    await user.click(screen.getByRole("button", { name: "Remove from favorites" }))
    await user.click(screen.getByRole("button", { name: "Remove" }))

    expect(onToggleFavorite).toHaveBeenCalledTimes(1)
  })

  it("omits the location and description lines when the vendor has none", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ about: "", location: undefined })} />)

    expect(screen.queryByText("Trusted dental supplies vendor")).not.toBeInTheDocument()
  })

  it("shows initials when the vendor has no logo", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ name: "Belen Dental Group" })} />)

    expect(screen.getByText("BD")).toBeInTheDocument()
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })

  it("renders the vendor's logo when a valid photo URL is set", () => {
    render(
      <SupplierDirectoryCard
        supplier={makeSupplier({ name: "Belen Dental Group", companyPhoto: "https://example.com/logo.png" })}
      />,
    )

    expect(screen.getByRole("img", { name: "Belen Dental Group logo" })).toBeInTheDocument()
  })

  it("shows the shipment policy badge when set", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ shipmentPolicy: "THREE_DAYS" })} />)

    expect(screen.getByText("Ships in 3 days")).toBeInTheDocument()
  })

  it("hides the shipment policy badge when not set", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ shipmentPolicy: null })} />)

    expect(screen.queryByText(/Ships in/)).not.toBeInTheDocument()
  })
})
