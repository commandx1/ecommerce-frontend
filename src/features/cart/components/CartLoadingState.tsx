export default function CartLoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas py-12">
      {/* sr-only: the visible "Shopping Cart" h1 lives in CartContent/CartEmptyState,
          but this loading state renders before either mounts, so without this the
          page has zero headings for as long as the cart/license fetch is in flight.
          Deliberately worded differently from the final "Shopping Cart" heading so
          tests that wait for that exact accessible name don't resolve early against
          this transient node. */}
      <h1 className="sr-only">Loading Shopping Cart</h1>
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-brand" />
    </div>
  )
}
