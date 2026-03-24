interface CartEmptyStateProps {
  onContinueShopping: () => void
}

export default function CartEmptyState({ onContinueShopping }: CartEmptyStateProps) {
  return (
    <div className="min-h-screen bg-light-mint-gray py-12">
      <div className="app-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <h1 className="text-3xl font-bold text-steel-blue mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8">Add some products to your cart to get started.</p>
          <button
            type="button"
            onClick={onContinueShopping}
            className="bg-steel-blue text-white px-8 py-3 rounded-lg hover:bg-opacity-90 font-semibold transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  )
}
