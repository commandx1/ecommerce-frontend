import { Skeleton } from "@/components/ui/skeleton"

export default function ProductListingLoading() {
  return (
    <div>
      {/* Visually hidden - this skeleton is what a11y scans / screen readers
          can land on while the real page (ProductListingHeader's `<h1>Dental
          Products</h1>`) is still streaming in. Same text, so there's never a
          moment with zero or a mismatched page heading. */}
      {/* This skeleton's own only other heading (an sr-only h2 below) is one
          level under this h1 - no skip within the skeleton itself. */}
      <h1 className="sr-only">Dental Products</h1>

      {/* Page header */}
      <div className="border-b border-border-soft bg-surface py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <Skeleton className="h-10 w-64 rounded-xl" />
              <Skeleton className="h-5 w-96 rounded-full" />
              <div className="mt-2 flex flex-wrap items-center gap-6">
                <Skeleton className="h-4 w-36 rounded-full" />
                <Skeleton className="h-4 w-40 rounded-full" />
                <Skeleton className="h-4 w-32 rounded-full" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-36 rounded-lg" />
              <Skeleton className="h-11 w-36 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter/sort bar */}
      {/* z-30: must stay under the z-40 header so its dropdowns paint over this bar. */}
      <div className="sticky top-(--header-height) z-30 border-b border-border-soft bg-surface py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-9 w-24 rounded-lg lg:hidden" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-10 rounded-full" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-8 w-16 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-14 rounded-full" />
              <Skeleton className="h-9 w-40 rounded" />
              <Skeleton className="h-4 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="bg-surface-muted">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {/* Sidebar skeleton */}
            <aside className="hidden w-80 shrink-0 lg:block">
              <div className="rounded-2xl border border-border-soft bg-surface p-6">
                {/* Active filters */}
                <div className="mb-6 border-b border-border-soft pb-6">
                  <Skeleton className="mb-4 h-5 w-32 rounded-lg" />
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-7 w-20 rounded-full" />
                    <Skeleton className="h-7 w-24 rounded-full" />
                    <Skeleton className="h-7 w-16 rounded-full" />
                  </div>
                </div>

                {/* Brand filter */}
                <div className="mb-6 border-b border-border-soft pb-6">
                  <Skeleton className="mb-4 h-5 w-16 rounded-lg" />
                  <Skeleton className="mb-4 h-9 w-full rounded-lg" />
                  <div className="space-y-3">
                    {[28, 32, 20, 24, 28].map((w, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className={`h-4 rounded`} style={{ width: `${w * 4}px` }} />
                        </div>
                        <Skeleton className="h-3 w-8 rounded" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category filter */}
                <div className="mb-6 border-b border-border-soft pb-6">
                  <Skeleton className="mb-4 h-5 w-20 rounded-lg" />
                  <div className="space-y-3">
                    {[36, 28, 32, 24].map((w, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className={`h-4 rounded`} style={{ width: `${w * 4}px` }} />
                        </div>
                        <Skeleton className="h-3 w-8 rounded" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div className="mb-6 border-b border-border-soft pb-6">
                  <Skeleton className="mb-4 h-5 w-24 rounded-lg" />
                  <div className="mb-4 flex gap-3">
                    <Skeleton className="h-10 flex-1 rounded-lg" />
                    <Skeleton className="h-10 flex-1 rounded-lg" />
                  </div>
                  <div className="space-y-3">
                    {[24, 28, 20, 32].map((w, i) => (
                      <Skeleton key={i} className={`h-4 rounded`} style={{ width: `${w * 4}px` }} />
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <Skeleton className="mb-4 h-5 w-28 rounded-lg" />
                  <div className="space-y-3">
                    {[28, 24, 24].map((w, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className={`h-4 rounded`} style={{ width: `${w * 4}px` }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Main area */}
            <main className="min-w-0 flex-1">
              {/* Results summary */}
              <div className="mb-6 rounded-2xl border border-border-soft bg-surface p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-48 rounded-lg" />
                    <Skeleton className="h-4 w-72 rounded-lg" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-28 rounded-lg" />
                    <Skeleton className="h-9 w-28 rounded-lg" />
                    <Skeleton className="h-9 w-32 rounded-lg" />
                  </div>
                </div>
              </div>

              {/* a11y: the root layout's persistent <Footer> renders its own <h3>s
                  ("Products"/"Services"/"Support") regardless of which page content is showing,
                  including this skeleton. With nothing between this file's sr-only h1 and that
                  footer, an a11y scan landing on this skeleton would see a straight h1 -> h3
                  jump. This sr-only h2 bridges that gap. */}
              <h2 className="sr-only">Loading products</h2>

              {/* Product card skeletons */}
              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="overflow-hidden rounded-2xl border border-border-soft bg-surface">
                    <Skeleton className="h-64 w-full" />
                    <div className="space-y-3 p-6">
                      <Skeleton className="h-5 w-24 rounded" />
                      <Skeleton className="h-6 w-3/4 rounded-lg" />
                      <Skeleton className="h-4 w-full rounded" />
                      <Skeleton className="h-4 w-2/3 rounded" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-24 rounded" />
                        <Skeleton className="h-4 w-16 rounded" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-8 w-24 rounded-lg" />
                        <Skeleton className="h-5 w-16 rounded" />
                      </div>
                      <Skeleton className="h-4 w-40 rounded" />
                      <div className="flex gap-2">
                        <Skeleton className="h-10 flex-1 rounded-lg" />
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <Skeleton className="h-10 w-10 rounded-lg" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination skeleton */}
              <div className="rounded-2xl border border-border-soft bg-surface p-6">
                <div className="flex flex-col items-center gap-4 lg:flex-row lg:justify-between">
                  <Skeleton className="h-4 w-48 rounded" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-24 rounded-lg" />
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-9 w-9 rounded-lg" />
                    ))}
                    <Skeleton className="h-9 w-24 rounded-lg" />
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
