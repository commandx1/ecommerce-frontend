import { Trash2, Truck } from "lucide-react"
import ConfirmationModal from "@/components/feedback/ConfirmationModal"
import SectionHeading from "@/components/layout/SectionHeading"
import SurfaceCard from "@/components/ui/SurfaceCard"
import CartItemCard from "@/features/cart/components/CartItemCard"
import type { CartSellerGroup } from "@/features/cart/types"
import type { CartItem } from "@/stores/cartStore"

interface CartItemsPanelProps {
  cartId: string | null
  isClearConfirmOpen: boolean
  items: CartItem[]
  sellerGroups: Record<string, CartSellerGroup>
  onCloseClearConfirm: () => void
  onConfirmClearCart: () => Promise<void>
  onOpenClearConfirm: () => void
  onQuantityChange: (userProductId: string, currentQuantity: number, delta: number) => void
  onRemoveItem: (userProductId: string) => void
}

export default function CartItemsPanel({
  cartId,
  isClearConfirmOpen,
  items,
  sellerGroups,
  onCloseClearConfirm,
  onConfirmClearCart,
  onOpenClearConfirm,
  onQuantityChange,
  onRemoveItem,
}: CartItemsPanelProps) {
  return (
    <SurfaceCard className="p-6">
      <SectionHeading
        titleAs="h2"
        title={`Cart Items (${items.length})`}
        titleClassName="text-xl"
        className="mb-6"
        actions={
          <button
            type="button"
            onClick={onOpenClearConfirm}
            disabled={!cartId || items.length === 0}
            className="cursor-pointer flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Clear cart
          </button>
        }
      />

      <div className="space-y-6">
        {Object.entries(sellerGroups).map(([sellerId, group]) => (
          <div key={sellerId} className="space-y-4">
            <div className="flex items-center justify-between border-b border-border-soft pb-3">
              <h4 className="flex items-center text-sm font-semibold text-text-secondary">
                <Truck className="mr-2 h-4 w-4 text-brand" />
                Shipping from: <span className="ml-1 text-brand">{group.name}</span>
              </h4>
              <span className="rounded-full bg-surface-muted px-2 py-1 text-xs font-medium text-text-muted">
                {group.items.length} items
              </span>
            </div>

            <div className="space-y-4">
              {group.items.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  onQuantityChange={onQuantityChange}
                  onRemoveItem={onRemoveItem}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <ConfirmationModal
        isOpen={isClearConfirmOpen}
        onClose={onCloseClearConfirm}
        onConfirm={() => {
          void onConfirmClearCart()
        }}
        title="Clear cart?"
        description="All items will be removed from your cart. This cannot be undone."
        confirmText="Clear cart"
        cancelText="Cancel"
        isDanger
      />
    </SurfaceCard>
  )
}
