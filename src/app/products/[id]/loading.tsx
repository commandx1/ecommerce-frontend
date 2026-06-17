export default function ProductDetailLoading() {
  return (
    <div>
      {/* Top progress bar */}
      <div className="h-1 w-full overflow-hidden bg-border-soft">
        <div className="loading-progress-bar h-full rounded-r-full bg-steel-blue" />
      </div>

      {/* Breadcrumb */}
      <div className="border-b border-border-soft bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="skeleton-white h-3 w-10 rounded-full" />
            <div className="skeleton-white h-2 w-2 rounded-full" />
            <div className="skeleton-white h-3 w-20 rounded-full" />
            <div className="skeleton-white h-2 w-2 rounded-full" />
            <div className="skeleton-white h-3 w-28 rounded-full" />
            <div className="skeleton-white h-2 w-2 rounded-full" />
            <div className="skeleton-white h-3 w-48 rounded-full" />
          </div>
        </div>
      </div>

      {/* Status banner */}
      <div className="bg-steel-blue py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 sm:px-6 lg:px-8">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <span className="text-sm font-medium text-white">Fetching product details...</span>
          <div className="ml-1 flex gap-1">
            <div className="dot-bounce-1 h-1.5 w-1.5 rounded-full bg-pale-lime" />
            <div className="dot-bounce-2 h-1.5 w-1.5 rounded-full bg-pale-lime" />
            <div className="dot-bounce-3 h-1.5 w-1.5 rounded-full bg-pale-lime" />
          </div>
        </div>
      </div>

      {/* Hero: image + product info */}
      <div className="bg-surface py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">

            {/* Image skeleton */}
            <div className="space-y-4">
              <div className="skeleton-mint relative aspect-square w-full overflow-hidden rounded-2xl">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-elevated/60">
                    <svg className="h-8 w-8 text-steel-blue opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton-mint aspect-square rounded-lg" />
                ))}
              </div>
            </div>

            {/* Product info skeleton */}
            <div className="flex flex-col gap-5">
              <div className="flex gap-3">
                <div className="skeleton-white h-7 w-28 rounded-full" />
                <div className="skeleton-white h-7 w-24 rounded-full" />
              </div>
              <div className="space-y-3">
                <div className="skeleton-white h-9 w-full rounded-xl" />
                <div className="skeleton-white h-9 w-3/4 rounded-xl" />
              </div>
              <div className="space-y-2">
                <div className="skeleton-white h-4 w-full rounded-full" />
                <div className="skeleton-white h-4 w-full rounded-full" />
                <div className="skeleton-white h-4 w-5/6 rounded-full" />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="skeleton-white h-5 w-5 rounded-sm" />
                  ))}
                </div>
                <div className="skeleton-white h-4 w-20 rounded-full" />
                <div className="skeleton-white h-4 w-28 rounded-full" />
              </div>
              <div className="mt-2 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-white h-20 rounded-xl" />
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
            <div className="skeleton-white h-8 w-72 rounded-xl" />
            <div className="skeleton-white h-4 w-96 rounded-full" />
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
                    <div className="skeleton-mint h-12 w-12 flex-shrink-0 rounded-lg" />
                    <div className="space-y-1.5">
                      <div className="skeleton-white h-4 w-24 rounded-full" />
                      <div className="skeleton-white h-3 w-16 rounded-full" />
                    </div>
                  </div>
                  <div className="space-y-1 text-center">
                    <div className="skeleton-white mx-auto h-7 w-20 rounded-lg" />
                    <div className="skeleton-white mx-auto h-3 w-14 rounded-full" />
                  </div>
                  <div className="flex justify-center">
                    <div className="skeleton-white h-7 w-20 rounded-full" />
                  </div>
                  <div className="space-y-1 text-center">
                    <div className="skeleton-white mx-auto h-4 w-12 rounded-full" />
                    <div className="skeleton-white mx-auto h-3 w-16 rounded-full" />
                  </div>
                  <div className="flex justify-center">
                    <div className="skeleton-white h-4 w-16 rounded-full" />
                  </div>
                  <div className="flex justify-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div key={s} className="skeleton-white h-4 w-4 rounded-sm" />
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <div className="skeleton-white h-9 w-24 rounded-lg" />
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
              <div className="skeleton-mint mb-6 h-9 w-64 rounded-xl" />
              <div className="rounded-2xl bg-surface p-8">
                <div className="space-y-5">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="flex items-center justify-between border-b border-border-soft pb-4 last:border-0 last:pb-0">
                      <div className="skeleton-white h-4 w-28 rounded-full" />
                      <div className="skeleton-white h-4 w-36 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div className="skeleton-mint mb-6 h-9 w-72 rounded-xl" />
              <div className="space-y-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl bg-surface p-6">
                    <div className="flex items-start gap-4">
                      <div className="skeleton-white h-16 w-16 flex-shrink-0 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton-white h-6 w-36 rounded-lg" />
                        <div className="skeleton-white h-4 w-full rounded-full" />
                        <div className="skeleton-white h-4 w-4/5 rounded-full" />
                        <div className="skeleton-white mt-1 h-7 w-32 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
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
                <div className="skeleton-mint h-8 w-48 rounded-xl" />
                <div className="space-y-2">
                  <div className="skeleton-white h-4 w-20 rounded-full" />
                  <div className="flex items-center gap-4">
                    <div className="skeleton-white h-10 w-36 rounded-lg" />
                    <div className="skeleton-white h-4 w-36 rounded-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="skeleton-white h-4 w-28 rounded-full" />
                  <div className="grid grid-cols-3 gap-3">
                    <div className="skeleton-white h-24 rounded-xl" />
                    <div className="skeleton-mint h-24 rounded-xl" />
                    <div className="skeleton-white h-24 rounded-xl" />
                  </div>
                </div>
              </div>
              <div className="space-y-4 rounded-xl bg-surface p-6">
                <div className="skeleton-white h-6 w-36 rounded-lg" />
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="skeleton-white h-4 w-32 rounded-full" />
                      <div className="skeleton-white h-4 w-20 rounded-full" />
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t border-border-soft pt-3">
                    <div className="skeleton-white h-5 w-16 rounded-full" />
                    <div className="skeleton-white h-5 w-24 rounded-full" />
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="skeleton-mint h-12 w-full rounded-lg" />
                  <div className="h-12 w-full rounded-lg bg-pale-lime/30" style={{ backgroundImage: 'none' }} />
                  <div className="skeleton-white h-10 w-full rounded-lg" />
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
              <div className="skeleton-mint h-9 w-52 rounded-xl" />
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="skeleton-mint h-6 w-6 rounded-sm" />
                  ))}
                </div>
                <div className="skeleton-mint h-4 w-36 rounded-full" />
              </div>
            </div>
            <div className="skeleton-white h-11 w-36 rounded-lg" />
          </div>
          <div className="space-y-5">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl bg-surface p-8">
                <div className="flex items-start gap-4">
                  <div className="skeleton-white h-12 w-12 flex-shrink-0 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="skeleton-white h-4 w-36 rounded-full" />
                        <div className="skeleton-white h-3 w-52 rounded-full" />
                      </div>
                      <div className="space-y-1 text-right">
                        <div className="skeleton-white ml-auto h-4 w-24 rounded-full" />
                        <div className="skeleton-white ml-auto h-3 w-20 rounded-full" />
                      </div>
                    </div>
                    <div className="skeleton-white h-5 w-64 rounded-full" />
                    <div className="skeleton-white h-4 w-full rounded-full" />
                    <div className="skeleton-white h-4 w-4/5 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related products */}
      <div className="bg-surface py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="skeleton-white h-9 w-48 rounded-xl" />
            <div className="skeleton-white h-5 w-44 rounded-full" />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl bg-light-mint-gray">
                <div className="skeleton-mint h-48" />
                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <div className="skeleton-white h-6 w-24 rounded-full" />
                    <div className="skeleton-white h-6 w-6 rounded-full" />
                  </div>
                  <div className="skeleton-white h-5 w-40 rounded-full" />
                  <div className="skeleton-white h-4 w-full rounded-full" />
                  <div className="flex items-center justify-between pt-1">
                    <div className="skeleton-white h-7 w-20 rounded-full" />
                    <div className="skeleton-white h-9 w-24 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
