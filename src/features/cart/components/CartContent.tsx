import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SectionHeading from "@/components/layout/SectionHeading"
import CartItemsPanel from "@/features/cart/components/CartItemsPanel"
import CartSummaryPanel from "@/features/cart/components/CartSummaryPanel"
import type { CartSellerGroup, CartTotals } from "@/features/cart/types"
import type { CartItem } from "@/stores/cartStore"

interface CartContentProps {
  cartId: string | null
  blockingItemsCount: number
  hasBlockingItems: boolean
  isClearConfirmOpen: boolean
  isLicenseBlocked: boolean
  isTaxLoading: boolean
  items: CartItem[]
  sellerGroups: Record<string, CartSellerGroup>
  onCheckout: () => void
  onCloseClearConfirm: () => void
  onConfirmClearCart: () => Promise<void>
  onOpenClearConfirm: () => void
  onQuantityChange: (userProductId: string, currentQuantity: number, delta: number) => void
  onRemoveItem: (userProductId: string) => void
  totals: CartTotals
}

export default function CartContent({
  cartId,
  blockingItemsCount,
  hasBlockingItems,
  isClearConfirmOpen,
  isLicenseBlocked,
  isTaxLoading,
  items,
  sellerGroups,
  onCheckout,
  onCloseClearConfirm,
  onConfirmClearCart,
  onOpenClearConfirm,
  onQuantityChange,
  onRemoveItem,
  totals,
}: CartContentProps) {
  return (
    <PageSectionContainer as="main" className="min-h-screen bg-canvas py-8">
      <SectionHeading titleAs="h1" title="Shopping Cart" className="mb-8" />
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="mx-auto flex-1 lg:w-2/3">
          <CartItemsPanel
            cartId={cartId}
            isClearConfirmOpen={isClearConfirmOpen}
            items={items}
            sellerGroups={sellerGroups}
            onCloseClearConfirm={onCloseClearConfirm}
            onConfirmClearCart={onConfirmClearCart}
            onOpenClearConfirm={onOpenClearConfirm}
            onQuantityChange={onQuantityChange}
            onRemoveItem={onRemoveItem}
          />
        </div>
        <div className="lg:w-1/3">
          <CartSummaryPanel
            blockingItemsCount={blockingItemsCount}
            hasBlockingItems={hasBlockingItems}
            isCheckoutDisabled={items.length === 0}
            isLicenseBlocked={isLicenseBlocked}
            isTaxLoading={isTaxLoading}
            itemsCount={items.reduce((totalQuantity, item) => totalQuantity + item.quantity, 0)}
            onCheckout={onCheckout}
            totals={totals}
          />
        </div>
      </div>
    </PageSectionContainer>
  )
}
