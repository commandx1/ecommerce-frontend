import { Trash2 } from "lucide-react"
import ConfirmationModal from "@/app/components/ConfirmationModal"
import CartItemCard from "@/features/cart/components/CartItemCard"
import type { CartItem } from "@/stores/cartStore"

interface CartItemsPanelProps {
  cartId: string | null
  isClearConfirmOpen: boolean
  items: CartItem[]
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
  onCloseClearConfirm,
  onConfirmClearCart,
  onOpenClearConfirm,
  onQuantityChange,
  onRemoveItem,
}: CartItemsPanelProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-steel-blue">Cart Items ({items.length})</h2>
        <button
          type="button"
          onClick={onOpenClearConfirm}
          disabled={!cartId || items.length === 0}
          className="cursor-pointer flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-4 h-4" />
          Clear cart
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <CartItemCard key={item.id} item={item} onQuantityChange={onQuantityChange} onRemoveItem={onRemoveItem} />
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
    </div>
  )
}
