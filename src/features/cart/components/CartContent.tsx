import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SectionHeading from "@/components/layout/SectionHeading"
import CartItemsPanel from "@/features/cart/components/CartItemsPanel"
import CartSummaryPanel from "@/features/cart/components/CartSummaryPanel"
import type { CartSellerGroup, CartTotals } from "@/features/cart/types"
import type { AutoOrderPeriod } from "@/lib/constants/auto-order"
import type { DentalLicenseStatus } from "@/lib/helpers/dentalLicense"
import type { CartItem } from "@/stores/cartStore"

interface CartContentProps {
  cartId: string | null
  autoOrderItemsCount: number
  blockingItemsCount: number
  hasBlockingItems: boolean
  isClearConfirmOpen: boolean
  isLicenseBlocked: boolean
  isLicenseChecking: boolean
  licenseCheckFailed: boolean
  licenseStatus: DentalLicenseStatus | null
  licenseRejectionReason: string | null
  licenseRequiredProductIds: Set<string>
  isTaxLoading: boolean
  items: CartItem[]
  sellerGroups: Record<string, CartSellerGroup>
  onAutoOrderChange: (userProductId: string, period: AutoOrderPeriod | null) => Promise<void>
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
  autoOrderItemsCount,
  blockingItemsCount,
  hasBlockingItems,
  isClearConfirmOpen,
  isLicenseBlocked,
  isLicenseChecking,
  licenseCheckFailed,
  licenseStatus,
  licenseRejectionReason,
  licenseRequiredProductIds,
  isTaxLoading,
  items,
  sellerGroups,
  onAutoOrderChange,
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
        <div className="w-full min-w-0 flex-1 lg:w-2/3">
          <CartItemsPanel
            cartId={cartId}
            isClearConfirmOpen={isClearConfirmOpen}
            isLicenseBlocked={isLicenseBlocked}
            items={items}
            licenseRequiredProductIds={licenseRequiredProductIds}
            sellerGroups={sellerGroups}
            onAutoOrderChange={onAutoOrderChange}
            onCloseClearConfirm={onCloseClearConfirm}
            onConfirmClearCart={onConfirmClearCart}
            onOpenClearConfirm={onOpenClearConfirm}
            onQuantityChange={onQuantityChange}
            onRemoveItem={onRemoveItem}
          />
        </div>
        <div className="lg:w-1/3">
          <CartSummaryPanel
            autoOrderItemsCount={autoOrderItemsCount}
            blockingItemsCount={blockingItemsCount}
            hasBlockingItems={hasBlockingItems}
            isCheckoutDisabled={items.length === 0}
            isLicenseBlocked={isLicenseBlocked}
            isLicenseChecking={isLicenseChecking}
            licenseCheckFailed={licenseCheckFailed}
            licenseStatus={licenseStatus}
            licenseRejectionReason={licenseRejectionReason}
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
