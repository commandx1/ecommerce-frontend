import { Bolt, FileText, ShieldCheck, ShoppingCart } from "lucide-react"

interface PurchaseActionsProps {
  onAddToCart: () => void
  isAddingToCart: boolean
  stockCount: number
}

const PurchaseActions = ({ onAddToCart, isAddingToCart, stockCount }: PurchaseActionsProps) => {
  return (
    <>
      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={onAddToCart}
          disabled={isAddingToCart || stockCount <= 0}
          className="w-full bg-steel-blue text-white py-3 px-6 rounded-lg hover:bg-opacity-90 font-semibold text-lg flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          {isAddingToCart ? "Adding..." : stockCount <= 0 ? "Out of Stock" : "Add to Cart"}
        </button>
        <button
          type="button"
          disabled={stockCount <= 0}
          className="w-full bg-pale-lime text-steel-blue py-3 px-6 rounded-lg hover:bg-opacity-90 font-semibold flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Bolt className="w-5 h-5 mr-2" />
          Buy Now
        </button>
        <button
          type="button"
          className="w-full border border-steel-blue text-steel-blue py-2 px-6 rounded-lg hover:bg-steel-blue hover:text-white transition-colors flex items-center justify-center"
        >
          <FileText className="w-5 h-5 mr-2" />
          Request Quote
        </button>
      </div>

      <div className="mt-6 text-center">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <ShieldCheck className="w-4 h-4 text-green-500" />
          <span>Secure Checkout</span>
        </div>
      </div>
    </>
  )
}

export default PurchaseActions
