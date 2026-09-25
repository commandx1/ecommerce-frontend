import EmptyStateCard from "@/components/feedback/EmptyStateCard"
import PageSectionContainer from "@/components/layout/PageSectionContainer"

interface CartEmptyStateProps {
  onContinueShopping: () => void
}

export default function CartEmptyState({ onContinueShopping }: CartEmptyStateProps) {
  return (
    <div className="min-h-screen bg-canvas py-12">
      {/* `as="main"`, matching CartContent and CartLoadingState, so every /cart state has a main landmark. */}
      <PageSectionContainer as="main">
        {/* sr-only: EmptyStateCard's title is intentionally an h2 (it's a section
            card, not the page heading - see EmptyStateCard.tsx), so the empty-cart
            view needs its own page-level h1, matching CartContent's visible
            "Shopping Cart" heading for the non-empty view. */}
        <h1 className="sr-only">Shopping Cart</h1>
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
