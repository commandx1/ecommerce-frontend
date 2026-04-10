import { Bolt, FileText, ShieldCheck, ShoppingCart } from "lucide-react"
import ActionButton from "@/components/ui/ActionButton"
import AsyncSubmitButton from "@/components/ui/AsyncSubmitButton"

interface PurchaseActionsProps {
  onAddToCart: () => void
  isAddingToCart: boolean
  stockCount: number
}

const PurchaseActions = ({ onAddToCart, isAddingToCart, stockCount }: PurchaseActionsProps) => {
  const isOutOfStock = stockCount <= 0

  return (
    <>
      <div className="mt-6 space-y-3">
        <AsyncSubmitButton
          type="button"
          onClick={onAddToCart}
          idleText={isOutOfStock ? "Out of Stock" : "Add to Cart"}
          submittingText="Adding..."
          isSubmitting={isAddingToCart}
          disabled={isOutOfStock}
          size="lg"
          icon={<ShoppingCart className="h-5 w-5" />}
        />
        <ActionButton type="button" intent="secondary" size="lg" fullWidth disabled={isOutOfStock}>
          <Bolt className="w-5 h-5 mr-2" />
          Buy Now
        </ActionButton>
        <ActionButton type="button" intent="outline" fullWidth>
          <FileText className="w-5 h-5 mr-2" />
          Request Quote
        </ActionButton>
      </div>

      <div className="mt-6 text-center">
        <div className="flex items-center justify-center space-x-2 text-sm text-text-secondary">
          <ShieldCheck className="h-4 w-4 text-success" />
          <span>Secure Checkout</span>
        </div>
      </div>
    </>
  )
}

export default PurchaseActions
