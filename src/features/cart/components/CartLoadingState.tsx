import PageSectionContainer from "@/components/layout/PageSectionContainer"
import Skeleton from "@/components/ui/skeleton"

// Mirrors CartContent's two-column layout (items panel + summary panel) so the initial
// cart/license fetch doesn't flash a blank page or an unrelated full-screen spinner.
export default function CartLoadingState() {
  return (
    <PageSectionContainer as="main" className="min-h-screen bg-canvas py-8">
      {/* PageSectionContainer doesn't spread rest props, so aria-busy goes on this inner div. */}
      <div aria-busy="true">
        {/* sr-only: the visible "Shopping Cart" h1 lives in CartContent/CartEmptyState,
            but this loading state renders before either mounts, so without this the
            page has zero headings for as long as the cart/license fetch is in flight.
            Deliberately worded differently from the final "Shopping Cart" heading so
            tests that wait for that exact accessible name don't resolve early against
            this transient node. */}
        <h1 className="sr-only">Loading Shopping Cart</h1>
        <Skeleton className="mb-8 h-9 w-48" />
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="w-full min-w-0 flex-1 lg:w-2/3">
            <div className="rounded-[1.75rem] border border-border-soft bg-surface-elevated p-6 shadow-panel">
              {/* sr-only: mirrors CartItemsPanel's "Cart Items (n)" h2 so the page doesn't
                  skip a heading level (h1 -> h3) while this skeleton is on screen. */}
              <h2 className="sr-only">Cart Items</h2>
              <div className="mb-6 flex items-center justify-between">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border-soft pb-3">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <div className="space-y-4">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="flex items-start gap-4 rounded-[1.25rem] border border-border-soft bg-surface p-4 shadow-soft"
                      >
                        <Skeleton className="h-16 w-16 shrink-0 rounded-2xl" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-2/3" />
                          <Skeleton className="h-4 w-1/3" />
                          <div className="flex items-center justify-between pt-2">
                            <Skeleton className="h-9 w-28 rounded-full" />
                            <Skeleton className="h-5 w-16" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:w-1/3">
            <div className="rounded-[1.5rem] border border-border-soft bg-surface p-6 shadow-soft">
              <Skeleton className="mb-6 h-7 w-40" />
              <div className="mb-6 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex justify-between border-t border-border-soft pt-3">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
              <Skeleton className="h-11 w-full rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </PageSectionContainer>
  )
}
