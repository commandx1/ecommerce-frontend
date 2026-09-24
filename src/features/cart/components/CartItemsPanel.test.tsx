import { describe, expect, it, vi } from "vitest"
import type { CartSellerGroup } from "@/features/cart/types"
import { makeCartItem } from "@/test/factories"
import { render, screen } from "@/test/render"
import CartItemsPanel from "./CartItemsPanel"

const renderPanel = (sellerGroups: Record<string, CartSellerGroup>) => {
  render(
    <CartItemsPanel
      cartId="cart-1"
      isClearConfirmOpen={false}
      isLicenseBlocked={false}
      items={Object.values(sellerGroups).flatMap((group) => group.items)}
      licenseRequiredProductIds={new Set()}
      sellerGroups={sellerGroups}
      onAutoOrderChange={vi.fn().mockResolvedValue(undefined)}
      onCloseClearConfirm={vi.fn()}
      onConfirmClearCart={vi.fn().mockResolvedValue(undefined)}
      onOpenClearConfirm={vi.fn()}
      onQuantityChange={vi.fn()}
      onRemoveItem={vi.fn()}
    />,
  )
}

describe("CartItemsPanel", () => {
  it('labels a single-item seller group "1 item", not "1 items"', () => {
    renderPanel({
      "seller-1": { name: "Acme Dental", items: [makeCartItem({ id: "ci-1" })] },
    })

    expect(screen.getByText("1 item")).toBeInTheDocument()
    expect(screen.queryByText("1 items")).not.toBeInTheDocument()
  })

  it('labels a multi-item seller group "N items"', () => {
    renderPanel({
      "seller-1": {
        name: "Acme Dental",
        items: [makeCartItem({ id: "ci-1" }), makeCartItem({ id: "ci-2" })],
      },
    })

    expect(screen.getByText("2 items")).toBeInTheDocument()
  })
})
