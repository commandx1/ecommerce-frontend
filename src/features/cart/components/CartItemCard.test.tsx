import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { makeCartItem, makeCartProductInfo, makeCartUserProduct } from "@/test/factories"
import { render, screen } from "@/test/render"
import CartItemCard from "./CartItemCard"

const renderCard = (item = makeCartItem()) => {
  const handlers = {
    onAutoOrderChange: vi.fn().mockResolvedValue(undefined),
    onQuantityChange: vi.fn(),
    onRemoveItem: vi.fn(),
  }
  render(<CartItemCard item={item} {...handlers} />)
  return handlers
}

describe("CartItemCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("links the product name and thumbnail to the seller's own listing", () => {
    renderCard(
      makeCartItem({
        product: makeCartProductInfo({ id: "p-9", name: "Composite Kit" }),
        userProduct: makeCartUserProduct({ userProductId: "up-9" }),
      }),
    )

    const links = screen.getAllByRole("link")
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/products/p-9?vendorId=up-9")
      expect(link).toHaveAttribute("target", "_blank")
      expect(link).toHaveAttribute("rel", "noopener noreferrer")
    }
    expect(screen.getByRole("heading", { name: "Composite Kit" })).toBeInTheDocument()
  })

  it("escapes the vendor id it puts in the query string", () => {
    renderCard(makeCartItem({ userProduct: makeCartUserProduct({ userProductId: "up 1&x" }) }))

    expect(screen.getAllByRole("link")[0]).toHaveAttribute("href", expect.stringContaining("vendorId=up%201%26x"))
  })

  it("steps the quantity up and down by one through the parent handler", async () => {
    const user = userEvent.setup()
    const handlers = renderCard(
      makeCartItem({ quantity: 4, userProduct: makeCartUserProduct({ userProductId: "up-4" }) }),
    )

    expect(screen.getByText("4")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Increase quantity" }))
    await user.click(screen.getByRole("button", { name: "Decrease quantity" }))

    expect(handlers.onQuantityChange).toHaveBeenNthCalledWith(1, "up-4", 4, 1)
    expect(handlers.onQuantityChange).toHaveBeenNthCalledWith(2, "up-4", 4, -1)
  })

  it("removes the line by its user-product id", async () => {
    const user = userEvent.setup()
    const handlers = renderCard(makeCartItem({ userProduct: makeCartUserProduct({ userProductId: "up-rm" }) }))

    await user.click(screen.getByRole("button", { name: "Remove item" }))

    expect(handlers.onRemoveItem).toHaveBeenCalledWith("up-rm")
  })

  it("multiplies both shipping fees by the line quantity", () => {
    renderCard(
      makeCartItem({
        quantity: 3,
        userProduct: makeCartUserProduct({
          price: 50,
          oldPrice: 100,
          discount: 50,
          shipmentFee: 5,
          heavyShippingSurcharge: 20,
        }),
      }),
    )

    expect(screen.getByText("$15.00")).toBeInTheDocument() // shipment 5 x 3
    expect(screen.getByText("$60.00")).toBeInTheDocument() // heavy 20 x 3
    expect(screen.getByText("$75.00")).toBeInTheDocument() // total shipping
    expect(screen.getByText("-50%")).toBeInTheDocument()
    expect(screen.getByText("$100.00")).toBeInTheDocument() // struck-through old price
  })

  it("hides the discount badge and old price when there is no discount", () => {
    renderCard(makeCartItem({ userProduct: makeCartUserProduct({ discount: 0, oldPrice: 70, price: 70 }) }))

    expect(screen.queryByText(/^-\d/)).not.toBeInTheDocument()
    expect(screen.queryByText("$70.00")).toBeInTheDocument()
  })

  it("renders a one-decimal discount badge for a fractional percentage", () => {
    renderCard(makeCartItem({ userProduct: makeCartUserProduct({ discount: 12.55 }) }))

    expect(screen.getByText("-12.6%")).toBeInTheDocument()
  })

  it("surfaces every blocking alert and locks the auto-reorder control", () => {
    renderCard(
      makeCartItem({
        product: makeCartProductInfo({ productAlert: "Product deactivated" }),
        userProduct: makeCartUserProduct({ stockAlert: "Out of stock", userProductAlert: "Listing removed" }),
      }),
    )

    expect(screen.getByText("This product is no longer active")).toBeInTheDocument()
    expect(screen.getByText("This item is out of stock")).toBeInTheDocument()
    expect(screen.getByText("This seller listing is no longer active")).toBeInTheDocument()
    expect(screen.getByRole("checkbox", { name: /Auto-reorder this item/i })).toBeDisabled()
  })

  it("treats a whitespace-only alert as no alert at all", () => {
    renderCard(makeCartItem({ userProduct: makeCartUserProduct({ stockAlert: "   " }) }))

    expect(screen.queryByText("This item is out of stock")).not.toBeInTheDocument()
    expect(screen.getByRole("checkbox", { name: /Auto-reorder this item/i })).toBeEnabled()
  })

  it("passes the item's saved schedule down to the auto-reorder control", () => {
    renderCard(makeCartItem({ autoOrder: "TWO_WEEKS" }))

    expect(screen.getByRole("checkbox", { name: /Auto-reorder this item/i })).toBeChecked()
    expect(screen.getByRole("combobox", { name: /Auto-reorder frequency/i })).toHaveTextContent("Every 15 days")
  })
})
