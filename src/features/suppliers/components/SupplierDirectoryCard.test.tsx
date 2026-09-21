import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SupplierDirectoryItem } from "@/features/suppliers/suppliersPageData"
import { fireEvent, render, screen } from "@/test/render"
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

  it("links to the catalogue filtered by that vendor and shows its product count", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier()} />)

    const link = screen.getByRole("link", { name: "View Catalog" })
    expect(link).toHaveAttribute("href", "/products?vendors=company-1")
    expect(screen.getByText("3,400 Products Available")).toBeInTheDocument()
  })

  it("hides the product count line for a vendor with no products, keeping the catalog link", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ productCount: 0 })} />)

    expect(screen.queryByText(/Products Available/)).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "View Catalog" })).toBeInTheDocument()
  })

  it("shows the verified partner badge", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier()} />)

    expect(screen.getByText("Verified partner")).toBeInTheDocument()
  })

  it("shows the about box only when the vendor has a description", () => {
    const { rerender } = render(<SupplierDirectoryCard supplier={makeSupplier({ about: "" })} />)
    expect(screen.queryByText("About this vendor")).not.toBeInTheDocument()

    rerender(<SupplierDirectoryCard supplier={makeSupplier({ about: "Trusted dental supplies vendor" })} />)
    expect(screen.getByText("About this vendor")).toBeInTheDocument()
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

describe("SupplierDirectoryCard - product count line", () => {
  it("pluralises a single product as singular", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ productCount: 1 })} />)
    expect(screen.getByText("1 Product Available")).toBeInTheDocument()
  })

  it("pluralises two products", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ productCount: 2 })} />)
    expect(screen.getByText("2 Products Available")).toBeInTheDocument()
  })

  it("groups the thousands in a large product count", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ productCount: 1234567 })} />)
    expect(screen.getByText("1,234,567 Products Available")).toBeInTheDocument()
  })

  it.each([0, -5])("hides the product count line for productCount=%d", (productCount) => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ productCount })} />)
    expect(screen.queryByText(/Available/)).not.toBeInTheDocument()
  })

  it("hides the whole feature block when there is nothing to show, but keeps the CTA", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ productCount: 0, shipmentPolicy: null })} />)

    expect(screen.queryByText(/Available/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Ships in/)).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "View Catalog" })).toBeInTheDocument()
  })
})

describe("SupplierDirectoryCard - shipment policy line", () => {
  it.each([
    ["ONE_DAY", "Ships in 1 day"],
    ["TWO_DAYS", "Ships in 2 days"],
    ["THREE_DAYS", "Ships in 3 days"],
    ["FOUR_DAYS", "Ships in 4 days"],
    ["FIVE_DAYS", "Ships in 5 days"],
  ])("shows %s as %s", (shipmentPolicy, expected) => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ shipmentPolicy: shipmentPolicy as never })} />)
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it.each([null, undefined])("hides the shipment line when shipmentPolicy is %s", (shipmentPolicy) => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ shipmentPolicy })} />)
    expect(screen.queryByText(/Ships in/)).not.toBeInTheDocument()
  })

  // "toString"/"constructor" live on Object.prototype, so an `in` check would let them through.
  it.each(["SIX_DAYS", "toString", "constructor"])(
    "hides the shipment line and never leaks 'undefined' for the unmapped policy value %s",
    (shipmentPolicy) => {
      render(<SupplierDirectoryCard supplier={makeSupplier({ shipmentPolicy: shipmentPolicy as never })} />)

      expect(screen.queryByText(/Ships in/)).not.toBeInTheDocument()
      expect(screen.queryByText(/undefined/)).not.toBeInTheDocument()
    },
  )

  it("shows the shipment line alone when there are no products", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ productCount: 0, shipmentPolicy: "TWO_DAYS" })} />)

    expect(screen.getByText("Ships in 2 days")).toBeInTheDocument()
    expect(screen.queryByText(/Available/)).not.toBeInTheDocument()
  })
})

describe("SupplierDirectoryCard - about box", () => {
  it("hides the about box when the description is only whitespace", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ about: "   \n  " })} />)
    expect(screen.queryByText("About this vendor")).not.toBeInTheDocument()
  })

  it("trims the description before rendering it", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ about: "  padded  " })} />)
    expect(screen.getByText("padded")).toBeInTheDocument()
  })

  it("renders hostile markup in the description as inert text, not as HTML", () => {
    const hostile = "<script>alert(1)</script><img src=x onerror=alert(1)>"
    render(<SupplierDirectoryCard supplier={makeSupplier({ about: hostile })} />)

    expect(screen.getByText(hostile)).toBeInTheDocument()
    const card = screen.getByRole("article")
    expect(card.querySelector("script")).toBeNull()
    expect(card.querySelectorAll("img")).toHaveLength(0)
  })

  it("does not crash when about is not a string at runtime and renders no about box", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ about: undefined as never })} />)
    expect(screen.queryByText("About this vendor")).not.toBeInTheDocument()
  })
})

describe("SupplierDirectoryCard - rating stars", () => {
  const filledStarCount = (container: HTMLElement) =>
    Array.from(container.querySelectorAll(".lucide-star")).filter((star) => star.classList.contains("fill-current"))
      .length

  it.each([
    [0, 0],
    [4.4, 4],
    [4.5, 5],
    [4.6, 5],
    [5, 5],
    [2.5, 3],
  ])("rating %s fills %d stars", (rating, expectedFilled) => {
    const { container } = render(<SupplierDirectoryCard supplier={makeSupplier({ rating })} />)
    expect(filledStarCount(container)).toBe(expectedFilled)
    expect(container.querySelectorAll(".lucide-star")).toHaveLength(5)
  })

  it("clamps an out-of-range rating to at most 5 filled stars out of 5 total", () => {
    const { container } = render(<SupplierDirectoryCard supplier={makeSupplier({ rating: 7 })} />)
    expect(filledStarCount(container)).toBe(5)
    expect(container.querySelectorAll(".lucide-star")).toHaveLength(5)
  })

  it("shows 0.0 for a zero rating", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ rating: 0 })} />)
    expect(screen.getByText("0.0")).toBeInTheDocument()
  })

  it("shows the rating rounded to one decimal exactly as toFixed(1) would produce", () => {
    const rating = 4.25
    render(<SupplierDirectoryCard supplier={makeSupplier({ rating })} />)
    expect(screen.getByText(rating.toFixed(1))).toBeInTheDocument()
  })

  it("shows a zero review count", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ reviewCount: 0 })} />)
    expect(screen.getByText("(0 ratings)")).toBeInTheDocument()
  })

  it("groups a large review count", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ reviewCount: 1000000 })} />)
    expect(screen.getByText("(1,000,000 ratings)")).toBeInTheDocument()
  })
})

describe("SupplierDirectoryCard - initials", () => {
  it.each([
    ["Acme Dental", "AD"],
    ["acme dental", "AD"],
    ["Acme", "A"],
    ["Acme Dental Supply Co", "AD"],
    ["  Acme   Dental  ", "AD"],
    ["", "?"],
    ["   ", "?"],
  ])("derives initials %j -> %s", (name, expected) => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ name })} />)
    expect(screen.getByText(expected)).toBeInTheDocument()
  })
})

describe("SupplierDirectoryCard - logo", () => {
  it.each([null, undefined, "", "/relative/logo.png", "ftp://x/logo.png", "javascript:alert(1)", "not a url"])(
    "shows initials instead of an image for companyPhoto=%j",
    (companyPhoto) => {
      render(<SupplierDirectoryCard supplier={makeSupplier({ companyPhoto: companyPhoto as never })} />)
      expect(screen.queryByRole("img")).not.toBeInTheDocument()
      expect(screen.getByText("AD")).toBeInTheDocument()
    },
  )

  it("shows the logo image with an accessible name and no initials for a valid http(s) URL", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ companyPhoto: "https://cdn.example.com/logo.png" })} />)

    expect(screen.getByRole("img", { name: "Acme Dental logo" })).toBeInTheDocument()
    expect(screen.queryByText("AD")).not.toBeInTheDocument()
  })

  it("falls back to initials once the logo image fails to load", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ companyPhoto: "https://cdn.example.com/logo.png" })} />)

    const img = screen.getByRole("img", { name: "Acme Dental logo" })
    fireEvent.error(img)

    expect(screen.queryByRole("img")).not.toBeInTheDocument()
    expect(screen.getByText("AD")).toBeInTheDocument()
  })

  it("marks the initials span as decorative", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier()} />)
    const initials = screen.getByText("AD")
    expect(initials).toHaveAttribute("aria-hidden", "true")
  })
})

describe("SupplierDirectoryCard - catalog CTA", () => {
  it("renders exactly one 'View Catalog' link", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier()} />)
    expect(screen.getAllByRole("link", { name: "View Catalog" })).toHaveLength(1)
  })

  it.each([
    ["company-1", "/products?vendors=company-1"],
    [42, "/products?vendors=42"],
  ])("links id=%j to %s", (id, expectedHref) => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ id })} />)
    expect(screen.getByRole("link", { name: "View Catalog" })).toHaveAttribute("href", expectedHref)
  })

  it("does not render legacy CTA copy", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier()} />)
    expect(screen.queryByRole("link", { name: /View .*Products/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/high trust fit/i)).not.toBeInTheDocument()
  })
})

describe("SupplierDirectoryCard - contact", () => {
  it.each([null, undefined, ""])("hides the contact link for email=%j", (email) => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ email: email as never })} />)
    expect(screen.queryByRole("link", { name: "Contact supplier" })).not.toBeInTheDocument()
  })

  it("builds a mailto href for an email with special characters", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ email: "sales+eu@acme.example.com" })} />)
    expect(screen.getByRole("link", { name: "Contact supplier" })).toHaveAttribute(
      "href",
      "mailto:sales+eu@acme.example.com",
    )
  })
})

describe("SupplierDirectoryCard - favourite control", () => {
  it("cancelling the removal popover leaves the favourite untouched and closes the popover", async () => {
    const user = userEvent.setup()
    const onToggleFavorite = vi.fn()
    render(<SupplierDirectoryCard supplier={makeSupplier({ isFavorite: true })} onToggleFavorite={onToggleFavorite} />)

    await user.click(screen.getByRole("button", { name: "Remove from favorites" }))
    expect(screen.getByText("Remove from favorites?")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(onToggleFavorite).not.toHaveBeenCalled()
    expect(screen.queryByText("Remove from favorites?")).not.toBeInTheDocument()
  })

  it("does not crash clicking add-favourite with no onToggleFavorite prop", async () => {
    const user = userEvent.setup()
    render(<SupplierDirectoryCard supplier={makeSupplier({ isFavorite: false })} />)
    await expect(user.click(screen.getByRole("button", { name: "Save to favorites" }))).resolves.not.toThrow()
  })

  it("does not crash confirming removal with no onToggleFavorite prop", async () => {
    const user = userEvent.setup()
    render(<SupplierDirectoryCard supplier={makeSupplier({ isFavorite: true })} />)
    await user.click(screen.getByRole("button", { name: "Remove from favorites" }))
    await expect(user.click(screen.getByRole("button", { name: "Remove" }))).resolves.not.toThrow()
  })

  it("a single click adds a favourite exactly once without showing the confirmation copy", async () => {
    const user = userEvent.setup()
    const onToggleFavorite = vi.fn()
    render(<SupplierDirectoryCard supplier={makeSupplier({ isFavorite: false })} onToggleFavorite={onToggleFavorite} />)

    await user.click(screen.getByRole("button", { name: "Save to favorites" }))

    expect(onToggleFavorite).toHaveBeenCalledTimes(1)
    expect(screen.queryByText("Remove from favorites?")).not.toBeInTheDocument()
  })

  it("fills the heart icon only when the supplier is already a favourite", () => {
    const { container: favContainer } = render(<SupplierDirectoryCard supplier={makeSupplier({ isFavorite: true })} />)
    const favHeart = favContainer.querySelector(".lucide-heart")
    expect(favHeart).not.toBeNull()
    expect(favHeart?.classList.contains("fill-current")).toBe(true)

    const { container: notFavContainer } = render(
      <SupplierDirectoryCard supplier={makeSupplier({ isFavorite: false })} />,
    )
    const notFavHeart = notFavContainer.querySelector(".lucide-heart")
    expect(notFavHeart).not.toBeNull()
    expect(notFavHeart?.classList.contains("fill-current")).toBe(false)
  })

  it("labels the favourite control as 'Save to favorites' when isFavorite is undefined", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier({ isFavorite: undefined })} />)
    expect(screen.getByRole("button", { name: "Save to favorites" })).toBeInTheDocument()
  })
})

describe("SupplierDirectoryCard - structure and accessibility", () => {
  it("renders an article landmark with a level-3 heading named after the supplier", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier()} />)
    const article = screen.getByRole("article")
    expect(article).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 3, name: "Acme Dental" })).toBeInTheDocument()
  })

  it("shows the location when provided and omits it otherwise", () => {
    const { rerender } = render(<SupplierDirectoryCard supplier={makeSupplier({ location: "Austin, TX" })} />)
    expect(screen.getByText("Austin, TX")).toBeInTheDocument()

    rerender(<SupplierDirectoryCard supplier={makeSupplier({ location: undefined })} />)
    expect(screen.queryByText("Austin, TX")).not.toBeInTheDocument()
  })

  it("hides the feature icons from assistive tech", () => {
    const { container } = render(
      <SupplierDirectoryCard supplier={makeSupplier({ productCount: 3, shipmentPolicy: "TWO_DAYS" })} />,
    )
    expect(container.querySelector(".lucide-circle-check-big")?.getAttribute("aria-hidden")).toBe("true")
    expect(container.querySelector(".lucide-truck")?.getAttribute("aria-hidden")).toBe("true")
  })

  it("keeps the CTA, favourite button, and contact link in DOM order: catalog, favourite, contact", () => {
    render(<SupplierDirectoryCard supplier={makeSupplier()} />)
    const catalog = screen.getByRole("link", { name: "View Catalog" })
    const favourite = screen.getByRole("button", { name: "Save to favorites" })
    const contact = screen.getByRole("link", { name: "Contact supplier" })

    expect(catalog.compareDocumentPosition(favourite) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(favourite.compareDocumentPosition(contact) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it("shows the verified partner badge and renders without crashing on minimal data", () => {
    render(
      <SupplierDirectoryCard
        supplier={makeSupplier({
          productCount: 0,
          about: "",
          email: null,
          shipmentPolicy: null,
          companyPhoto: null,
          location: undefined,
        })}
      />,
    )

    expect(screen.getByText("Verified partner")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 3, name: "Acme Dental" })).toBeInTheDocument()
    expect(screen.getByText("(1,284 ratings)")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "View Catalog" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save to favorites" })).toBeInTheDocument()
  })
})

describe("SupplierDirectoryCard - long and unusual input", () => {
  it("does not crash rendering a very long single-word name and shows it in full", () => {
    const name = "A".repeat(200)
    render(<SupplierDirectoryCard supplier={makeSupplier({ name })} />)
    expect(screen.getByRole("heading", { level: 3, name })).toBeInTheDocument()
  })

  it("renders HTML embedded in the name as inert text, not as an element", () => {
    const { container } = render(<SupplierDirectoryCard supplier={makeSupplier({ name: "<b>x</b>" })} />)
    expect(screen.getByText("<b>x</b>")).toBeInTheDocument()
    expect(container.querySelector("b")).toBeNull()
  })
})
