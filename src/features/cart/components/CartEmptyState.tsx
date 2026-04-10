import EmptyStateCard from "@/components/feedback/EmptyStateCard"
import PageSectionContainer from "@/components/layout/PageSectionContainer"

interface CartEmptyStateProps {
  onContinueShopping: () => void
}

export default function CartEmptyState({ onContinueShopping }: CartEmptyStateProps) {
  return (
    <div className="min-h-screen bg-canvas py-12">
      <PageSectionContainer as="div">
        <EmptyStateCard
          title="Your Cart is Empty"
          description="Add some products to your cart to get started."
          actionLabel="Continue Shopping"
          onAction={onContinueShopping}
        />
      </PageSectionContainer>
    </div>
  )
}
