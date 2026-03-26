import EmptyStateCard from "@/components/feedback/EmptyStateCard"

interface CartEmptyStateProps {
  onContinueShopping: () => void
}

export default function CartEmptyState({ onContinueShopping }: CartEmptyStateProps) {
  return (
    <div className="min-h-screen bg-light-mint-gray py-12">
      <div className="app-container mx-auto px-4 sm:px-6 lg:px-8">
        <EmptyStateCard
          title="Your Cart is Empty"
          description="Add some products to your cart to get started."
          actionLabel="Continue Shopping"
          onAction={onContinueShopping}
        />
      </div>
    </div>
  )
}
