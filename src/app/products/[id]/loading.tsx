import { Skeleton } from "@/components/ui/skeleton"
import RelatedProductsSkeleton from "@/features/products/product-detail/components/RelatedProductsSkeleton"

export default function ProductDetailLoading() {
  return (
    <div>
      {/* sr-only: what a screen reader lands on while the real page streams in. The product name is
          unknown here, so a generic title - deliberately different from the real h1 so tests
          asserting the product title never bind to this node. */}
      <h1 className="sr-only">Loading Product Details</h1>

      {/* Breadcrumb */}
      <div className="border-b border-border-soft bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-10 rounded-full" />
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-3 w-20 rounded-full" />
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-3 w-28 rounded-full" />
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-3 w-48 rounded-full" />
          </div>
        </div>
      </div>

      {/* a11y: the root layout's persistent <Footer> has its own <h3>s
          ("Products"/"Services"/"Support") that render regardless of this skeleton, so with no
          heading between this file's sr-only h1 and that footer, an a11y scan landing on this
          skeleton would see a straight h1 -> h3 jump. This sr-only h2 bridges that gap. */}
      <h2 className="sr-only">Loading product details</h2>

      {/* Hero: image + product info */}
      <div className="bg-surface py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Image skeleton */}
            <div className="space-y-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-skeleton-base">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-elevated/60">
                    <svg
                      aria-hidden="true"
                      className="h-8 w-8 text-steel-blue opacity-60"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            </div>

            {/* Product info skeleton */}
            <div className="flex flex-col gap-5">
              <div className="flex gap-3">
                <Skeleton className="h-7 w-28 rounded-full" />
                <Skeleton className="h-7 w-24 rounded-full" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-9 w-full rounded-xl" />
                <Skeleton className="h-9 w-3/4 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-4 w-5/6 rounded-full" />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-5 w-5 rounded-sm" />
                  ))}
                </div>
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="h-4 w-28 rounded-full" />
              </div>
              <div className="mt-2 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supplier comparison table skeleton */}
      <div className="border-t border-border-soft bg-surface py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 space-y-2">
            <Skeleton className="h-8 w-72 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-full" />
          </div>
          <div className="overflow-hidden rounded-2xl bg-light-mint-gray">
            {/* Table header */}
            <div className="grid grid-cols-7 gap-4 bg-steel-blue px-6 py-4">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="h-4 rounded-full bg-white/20" />
              ))}
            </div>
            {/* Table rows */}
            <div className="divide-y divide-border-soft bg-surface">
              {[1, 2, 3].map((row) => (
                <div key={row} className="grid grid-cols-7 items-center gap-4 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-24 rounded-full" />
                      <Skeleton className="h-3 w-16 rounded-full" />
                    </div>
                  </div>
                  <div className="space-y-1 text-center">
                    <Skeleton className="mx-auto h-7 w-20 rounded-lg" />
                    <Skeleton className="mx-auto h-3 w-14 rounded-full" />
                  </div>
                  <div className="flex justify-center">
                    <Skeleton className="h-7 w-20 rounded-full" />
                  </div>
                  <div className="space-y-1 text-center">
                    <Skeleton className="mx-auto h-4 w-12 rounded-full" />
                    <Skeleton className="mx-auto h-3 w-16 rounded-full" />
                  </div>
                  <div className="flex justify-center">
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <div className="flex justify-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Skeleton key={s} className="h-4 w-4 rounded-sm" />
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <Skeleton className="h-9 w-24 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Specs + certifications */}
      <div className="bg-light-mint-gray py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div>
              <Skeleton className="mb-6 h-9 w-64 rounded-xl" />
              <div className="rounded-2xl bg-surface p-8">
                <div className="space-y-5">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-b border-border-soft pb-4 last:border-0 last:pb-0"
                    >
                      <Skeleton className="h-4 w-28 rounded-full" />
                      <Skeleton className="h-4 w-36 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <Skeleton className="mb-6 h-9 w-72 rounded-xl" />
              <div className="rounded-2xl bg-surface p-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
                  <Skeleton className="h-4 w-48 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase section */}
      <div className="border-t border-border-soft bg-surface py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-light-mint-gray p-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="space-y-5 lg:col-span-2">
                <Skeleton className="h-8 w-48 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20 rounded-full" />
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-36 rounded-lg" />
                    <Skeleton className="h-4 w-36 rounded-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28 rounded-full" />
                  <div className="grid grid-cols-3 gap-3">
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-24 rounded-xl" />
                  </div>
                </div>
              </div>
              <div className="space-y-4 rounded-xl bg-surface p-6">
                <Skeleton className="h-6 w-36 rounded-lg" />
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32 rounded-full" />
                      <Skeleton className="h-4 w-20 rounded-full" />
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-border-soft pt-3">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <div className="h-12 w-full rounded-lg bg-pale-lime/30" style={{ backgroundImage: "none" }} />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="bg-light-mint-gray py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-9 w-52 rounded-xl" />
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-6 w-6 rounded-sm" />
                  ))}
                </div>
                <Skeleton className="h-4 w-36 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-11 w-36 rounded-lg" />
          </div>
          <div className="space-y-5">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl bg-surface p-8">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-36 rounded-full" />
                        <Skeleton className="h-3 w-52 rounded-full" />
                      </div>
                      <div className="space-y-1 text-right">
                        <Skeleton className="ml-auto h-4 w-24 rounded-full" />
                        <Skeleton className="ml-auto h-3 w-20 rounded-full" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-64 rounded-full" />
                    <Skeleton className="h-4 w-full rounded-full" />
                    <Skeleton className="h-4 w-4/5 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related products */}
      <RelatedProductsSkeleton />
    </div>
  )
}
