import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getProductWithOffers } from "@/lib/api/product-offers"
import { useAuthStore } from "@/stores/authStore"
import { useCartStore } from "@/stores/cartStore"
import { makeAccountUser } from "@/test/factories"
import { fireEvent, render, screen, waitFor } from "@/test/render"
import ProductCard, { type ProductCardData } from "./ProductCard"

const mockToastWarning = vi.fn()
const mockToastError = vi.fn()
const mockToastSuccess = vi.fn()
vi.mock("@/components/ui/Toast", () => ({
  showToast: {
    warning: (...args: unknown[]) => mockToastWarning(...args),
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
    info: vi.fn(),
  },
}))

vi.mock("@/lib/api/product-offers", () => ({
  getProductWithOffers: vi.fn(),
}))

const signIn = () => useAuthStore.getState().setAuth(makeAccountUser(), "token-1", "refresh-1")

const makeData = (overrides: Partial<ProductCardData> = {}): ProductCardData => ({
  id: "p-1",
  name: "Intra Oral Mixing Tips",
  brand: "MARK3",
  imageSrc: "/uploads/tips.png",
  price: 56,
  oldPrice: 70,
  overallStar: 4.5,
  reviewCount: 12,
  stock: 40,
  href: "/products/p-1",
  ...overrides,
})

describe("ProductCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("links the title and the preview action to the product detail page", () => {
    render(<ProductCard data={makeData({ href: "/products/p-9" })} />)

    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("href", "/products/p-9")
    }
  })

  // A11y: this icon-only link had no accessible name at all (axe `link-name`,
  // 4 nodes on `/` - the 4 trending-product cards share this component).
  // aria-label must name the product, not just say "link"/"view".
  it("gives the icon-only preview link an accessible name that names the product", () => {
    render(<ProductCard data={makeData({ name: "Intra Oral Mixing Tips" })} />)

    expect(screen.getByRole("link", { name: "View Intra Oral Mixing Tips details" })).toHaveAttribute(
      "href",
      "/products/p-1",
    )
  })

  it("computes the saving from the old price", () => {
    render(<ProductCard data={makeData({ price: 75, oldPrice: 100 })} />)

    expect(screen.getByText("Save 25%")).toBeInTheDocument()
    expect(screen.getByText("$100.00")).toBeInTheDocument()
  })

  it("hides the saving badge when the old price is not higher", () => {
    render(<ProductCard data={makeData({ price: 100, oldPrice: 100 })} />)

    expect(screen.queryByText(/^Save /)).not.toBeInTheDocument()
    expect(screen.getByText("$100.00")).toBeInTheDocument()
  })

  it("reports availability from the stock count", () => {
    render(<ProductCard data={makeData({ stock: 0 })} />)

    // "Out of Stock" now appears twice: the availability badge and the disabled Add to Cart
    // button label (see the "Add to Cart" describe block below for the button-specific test).
    expect(screen.getAllByText("Out of Stock").length).toBeGreaterThan(0)
    expect(screen.queryByText("In Stock")).not.toBeInTheDocument()
  })

  it("omits the availability badge entirely when stock is unknown", () => {
    render(<ProductCard data={makeData({ stock: undefined })} />)

    expect(screen.queryByText("In Stock")).not.toBeInTheDocument()
    expect(screen.queryByText("Out of Stock")).not.toBeInTheDocument()
  })

  it("shows the rating to one decimal with its review count", () => {
    render(<ProductCard data={makeData({ overallStar: 4.25, reviewCount: 8 })} />)

    expect(screen.getByText("4.3 (8 reviews)")).toBeInTheDocument()
  })

  it("falls back to a generic supplier phrase without a brand", () => {
    render(<ProductCard data={makeData({ brand: null })} />)

    expect(screen.getByText(/from verified supplier/i)).toBeInTheDocument()
    expect(screen.queryByText("MARK3")).not.toBeInTheDocument()
  })

  // FIX: the price now goes through `formatCurrency` instead of a raw `toFixed(2)`, so
  // four-figure prices keep their thousands separator ("$1,234.50" instead of "$1234.50") —
  // consistent with the other price surfaces in the app.
  it("renders a four-figure price with a thousands separator", () => {
    render(<ProductCard data={makeData({ price: 1234.5, oldPrice: null })} />)

    expect(screen.getByText("$1,234.50")).toBeInTheDocument()
    expect(screen.queryByText("$1234.50")).not.toBeInTheDocument()
  })

  // The favourite and compare controls were removed (27 Aug 2026, user decision): both were
  // handler-less, so a shopper clicking them got a silent no-op. A control that cannot work is
  // worse than no control. This test is the guard against either one reappearing unwired - for
  // data WITHOUT `favoriteProductId` (the favorite heart is opt-in per card, see the sibling
  // test below for the case where it is set).
  it("does not render a favorites button when favoriteProductId is not set", () => {
    render(<ProductCard data={makeData()} />)

    expect(screen.queryByRole("button", { name: /favorites/i })).not.toBeInTheDocument()
    // The detail link (Eye icon) is a real <a>, so the only buttons left are the quantity
    // stepper (Decrease/Increase) and Add to Cart - all wired.
    const buttonNames = screen
      .getAllByRole("button")
      .map((button) => button.getAttribute("aria-label") || button.textContent)
    expect(new Set(buttonNames)).toEqual(new Set(["Decrease quantity", "Increase quantity", "Add to Cart"]))
  })

  it("renders a favorites button when favoriteProductId is set", () => {
    render(<ProductCard data={makeData({ favoriteProductId: "p-1" })} />)

    expect(screen.getByRole("button", { name: "Save to favorites" })).toBeInTheDocument()
  })

  it("reports availability from the stock count and disables the button when out of stock", () => {
    render(<ProductCard data={makeData({ stock: 0 })} />)

    const button = screen.getByRole("button", { name: "Out of Stock" })
    expect(button).toBeDisabled()
  })

  describe("Add to Cart", () => {
    const product = {
      id: "p-1",
      name: "Intra Oral Mixing Tips",
      price: 56,
      bestPriceVendorUserProductId: "up-best",
    }

    it("warns an anonymous shopper to sign in and fetches nothing", async () => {
      render(<ProductCard data={makeData()} />)

      await userEvent.setup().click(screen.getByRole("button", { name: "Add to Cart" }))

      expect(mockToastWarning).toHaveBeenCalledWith("Login required", expect.any(String))
      expect(getProductWithOffers).not.toHaveBeenCalled()
    })

    it("adds the best-price offer to the cart and shows a success toast when signed in", async () => {
      signIn()
      vi.mocked(getProductWithOffers).mockResolvedValue({
        product,
        userProducts: [
          { id: "up-cheap", price: 10, stock: 5 },
          { id: "up-best", price: 5, stock: 5 },
        ],
      } as never)
      const mockAddToCart = vi.fn().mockResolvedValue(undefined)
      useCartStore.setState({ addToCart: mockAddToCart })

      render(<ProductCard data={makeData({ id: "p-1", name: "Intra Oral Mixing Tips" })} />)
      await userEvent.setup().click(screen.getByRole("button", { name: "Add to Cart" }))

      await waitFor(() => expect(mockAddToCart).toHaveBeenCalledWith("up-best", 1))
      expect(mockToastSuccess).toHaveBeenCalledWith("Added to cart", "1 × Intra Oral Mixing Tips added to your cart.")
    })

    it("increases the quantity twice, then adds three units to the cart", async () => {
      signIn()
      vi.mocked(getProductWithOffers).mockResolvedValue({
        product,
        userProducts: [{ id: "up-best", price: 5, stock: 5 }],
      } as never)
      const mockAddToCart = vi.fn().mockResolvedValue(undefined)
      useCartStore.setState({ addToCart: mockAddToCart })

      const user = userEvent.setup()
      render(<ProductCard data={makeData({ id: "p-1", name: "Intra Oral Mixing Tips" })} />)
      await user.click(screen.getByRole("button", { name: "Increase quantity" }))
      await user.click(screen.getByRole("button", { name: "Increase quantity" }))
      await user.click(screen.getByRole("button", { name: "Add to Cart" }))

      await waitFor(() => expect(mockAddToCart).toHaveBeenCalledWith("up-best", 3))
    })

    it("disables Increase quantity at stock and Decrease quantity at one", async () => {
      const user = userEvent.setup()
      render(<ProductCard data={makeData({ stock: 2 })} />)

      expect(screen.getByRole("button", { name: "Decrease quantity" })).toBeDisabled()
      await user.click(screen.getByRole("button", { name: "Increase quantity" }))

      expect(screen.getByRole("button", { name: "Increase quantity" })).toBeDisabled()
      expect(screen.getByRole("button", { name: "Decrease quantity" })).not.toBeDisabled()
    })

    it("lets a shopper type a quantity and sends it to the cart", async () => {
      signIn()
      vi.mocked(getProductWithOffers).mockResolvedValue({
        product,
        userProducts: [{ id: "up-best", price: 5, stock: 5 }],
      } as never)
      const mockAddToCart = vi.fn().mockResolvedValue(undefined)
      useCartStore.setState({ addToCart: mockAddToCart })

      const user = userEvent.setup()
      render(<ProductCard data={makeData({ id: "p-1", name: "Intra Oral Mixing Tips" })} />)
      const input = screen.getByRole("spinbutton")
      fireEvent.change(input, { target: { value: "5" } })
      await user.click(screen.getByRole("button", { name: "Add to Cart" }))

      await waitFor(() => expect(mockAddToCart).toHaveBeenCalledWith("up-best", 5))
    })

    it("clamps a typed zero quantity up to one", () => {
      render(<ProductCard data={makeData()} />)
      const input = screen.getByRole("spinbutton")
      fireEvent.change(input, { target: { value: "0" } })

      expect(input).toHaveValue(1)
    })

    it("resets the quantity to one after a successful add", async () => {
      signIn()
      vi.mocked(getProductWithOffers).mockResolvedValue({
        product,
        userProducts: [{ id: "up-best", price: 5, stock: 5 }],
      } as never)
      const mockAddToCart = vi.fn().mockResolvedValue(undefined)
      useCartStore.setState({ addToCart: mockAddToCart })

      const user = userEvent.setup()
      render(<ProductCard data={makeData({ id: "p-1", name: "Intra Oral Mixing Tips" })} />)
      await user.click(screen.getByRole("button", { name: "Increase quantity" }))
      await user.click(screen.getByRole("button", { name: "Add to Cart" }))

      await waitFor(() => expect(mockAddToCart).toHaveBeenCalledWith("up-best", 2))
      await waitFor(() => expect(screen.getByRole("spinbutton")).toHaveValue(1))
    })

    it("disables the stepper and input, alongside Add to Cart, when out of stock", () => {
      render(<ProductCard data={makeData({ stock: 0 })} />)

      expect(screen.getByRole("button", { name: "Decrease quantity" })).toBeDisabled()
      expect(screen.getByRole("button", { name: "Increase quantity" })).toBeDisabled()
      expect(screen.getByRole("spinbutton")).toBeDisabled()
      expect(screen.getByRole("button", { name: "Out of Stock" })).toBeDisabled()
    })

    it("shows an error toast and does not add to cart when no supplier is available", async () => {
      signIn()
      vi.mocked(getProductWithOffers).mockResolvedValue({
        product: { ...product, bestPriceVendorUserProductId: undefined },
        userProducts: [],
      } as never)
      const mockAddToCart = vi.fn().mockResolvedValue(undefined)
      useCartStore.setState({ addToCart: mockAddToCart })

      render(<ProductCard data={makeData()} />)
      await userEvent.setup().click(screen.getByRole("button", { name: "Add to Cart" }))

      await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("No supplier available", expect.any(String)))
      expect(mockAddToCart).not.toHaveBeenCalled()
    })

    it("shows a generic error toast when adding to the cart fails", async () => {
      signIn()
      vi.mocked(getProductWithOffers).mockResolvedValue({
        product,
        userProducts: [],
      } as never)
      const mockAddToCart = vi.fn().mockRejectedValue(new Error("boom"))
      useCartStore.setState({ addToCart: mockAddToCart })

      render(<ProductCard data={makeData()} />)
      await userEvent.setup().click(screen.getByRole("button", { name: "Add to Cart" }))

      await waitFor(() => expect(mockToastError).toHaveBeenCalledWith("Failed to add to cart", expect.any(String)))
    })
  })
})
