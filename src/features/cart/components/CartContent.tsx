import CartItemsPanel from "@/features/cart/components/CartItemsPanel"
import CartSummaryPanel from "@/features/cart/components/CartSummaryPanel"
import type { CartTotals } from "@/features/cart/types"
import type { CartItem } from "@/stores/cartStore"

interface CartContentProps {
  cartId: string | null
  isClearConfirmOpen: boolean
  items: CartItem[]
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
  isClearConfirmOpen,
  items,
  onCheckout,
  onCloseClearConfirm,
  onConfirmClearCart,
  onOpenClearConfirm,
  onQuantityChange,
  onRemoveItem,
  totals,
}: CartContentProps) {
  return (
    <div className="min-h-screen bg-light-mint-gray py-8">
      <div className="app-container mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-steel-blue mb-8">Shopping Cart</h1>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 lg:w-2/3 mx-auto">
            <CartItemsPanel
              cartId={cartId}
              isClearConfirmOpen={isClearConfirmOpen}
              items={items}
              onCloseClearConfirm={onCloseClearConfirm}
              onConfirmClearCart={onConfirmClearCart}
              onOpenClearConfirm={onOpenClearConfirm}
              onQuantityChange={onQuantityChange}
              onRemoveItem={onRemoveItem}
            />
          </div>
          <div className="lg:w-1/3">
            <CartSummaryPanel
              isCheckoutDisabled={items.length === 0}
              itemsCount={items.length}
              onCheckout={onCheckout}
              totals={totals}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
