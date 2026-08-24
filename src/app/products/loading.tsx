export default function ProductListingLoading() {
  return (
    <div>
      {/* Top progress bar */}
      <div className="h-1 w-full overflow-hidden bg-border-soft">
        <div className="loading-progress-bar h-full rounded-r-full bg-steel-blue" />
      </div>

      {/* Page header */}
      <div className="border-b border-border-soft bg-surface py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="skeleton-white h-10 w-64 rounded-xl" />
              <div className="skeleton-white h-5 w-96 rounded-full" />
              <div className="mt-2 flex flex-wrap items-center gap-6">
                <div className="skeleton-white h-4 w-36 rounded-full" />
                <div className="skeleton-white h-4 w-40 rounded-full" />
                <div className="skeleton-white h-4 w-32 rounded-full" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="skeleton-white h-11 w-36 rounded-lg" />
              <div className="skeleton-white h-11 w-36 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter/sort bar */}
      <div className="sticky top-16 z-40 border-b border-border-soft bg-surface py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="skeleton-white h-9 w-24 rounded-lg lg:hidden" />
              <div className="flex items-center gap-2">
                <div className="skeleton-white h-4 w-10 rounded-full" />
                <div className="skeleton-white h-8 w-8 rounded" />
                <div className="skeleton-white h-8 w-8 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <div className="skeleton-white h-4 w-24 rounded-full" />
                <div className="skeleton-white h-8 w-16 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="skeleton-white h-4 w-14 rounded-full" />
              <div className="skeleton-white h-9 w-40 rounded" />
              <div className="skeleton-white h-4 w-24 rounded-full" />
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
                  <div className="skeleton-white mb-4 h-5 w-32 rounded-lg" />
                  <div className="flex flex-wrap gap-2">
                    <div className="skeleton-white h-7 w-20 rounded-full" />
                    <div className="skeleton-white h-7 w-24 rounded-full" />
                    <div className="skeleton-white h-7 w-16 rounded-full" />
                  </div>
                </div>

                {/* Brand filter */}
                <div className="mb-6 border-b border-border-soft pb-6">
                  <div className="skeleton-white mb-4 h-5 w-16 rounded-lg" />
                  <div className="skeleton-white mb-4 h-9 w-full rounded-lg" />
                  <div className="space-y-3">
                    {[28, 32, 20, 24, 28].map((w, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="skeleton-white h-4 w-4 rounded" />
                          <div className={`skeleton-white h-4 rounded`} style={{ width: `${w * 4}px` }} />
                        </div>
                        <div className="skeleton-white h-3 w-8 rounded" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category filter */}
                <div className="mb-6 border-b border-border-soft pb-6">
                  <div className="skeleton-white mb-4 h-5 w-20 rounded-lg" />
                  <div className="space-y-3">
                    {[36, 28, 32, 24].map((w, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="skeleton-white h-4 w-4 rounded" />
                          <div className={`skeleton-white h-4 rounded`} style={{ width: `${w * 4}px` }} />
                        </div>
                        <div className="skeleton-white h-3 w-8 rounded" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div className="mb-6 border-b border-border-soft pb-6">
                  <div className="skeleton-white mb-4 h-5 w-24 rounded-lg" />
                  <div className="mb-4 flex gap-3">
                    <div className="skeleton-white h-10 flex-1 rounded-lg" />
                    <div className="skeleton-white h-10 flex-1 rounded-lg" />
                  </div>
                  <div className="space-y-3">
                    {[24, 28, 20, 32].map((w, i) => (
                      <div key={i} className={`skeleton-white h-4 rounded`} style={{ width: `${w * 4}px` }} />
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <div className="skeleton-white mb-4 h-5 w-28 rounded-lg" />
                  <div className="space-y-3">
                    {[28, 24, 24].map((w, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="skeleton-white h-4 w-4 rounded" />
                        <div className={`skeleton-white h-4 rounded`} style={{ width: `${w * 4}px` }} />
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
                    <div className="skeleton-white h-7 w-48 rounded-lg" />
                    <div className="skeleton-white h-4 w-72 rounded-lg" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="skeleton-white h-9 w-28 rounded-lg" />
                    <div className="skeleton-white h-9 w-28 rounded-lg" />
                    <div className="skeleton-white h-9 w-32 rounded-lg" />
                  </div>
                </div>
              </div>

              {/* Loading state indicator */}
              <div className="mb-6 rounded-2xl border border-border-soft bg-surface p-8">
                <div className="flex flex-col items-center justify-center">
                  {/* Animated icon */}
                  <div className="relative mb-6">
                    <div className="icon-float flex h-20 w-20 items-center justify-center rounded-full border-4 border-surface-muted">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-steel-blue/10">
                        <svg
                          aria-hidden="true"
                          className="h-8 w-8 animate-pulse text-steel-blue opacity-80"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2C9.5 2 7.5 3.5 7 5.5c-.3 1-.2 2.1.2 3-.8.5-1.5 1.3-1.8 2.3-.5 1.5 0 3.1 1 4.1.2 3.2 1.8 7.1 5.6 7.1s5.4-3.9 5.6-7.1c1-.9 1.5-2.6 1-4.1-.3-1-.9-1.8-1.8-2.3.4-.9.5-2 .2-3C16.5 3.5 14.5 2 12 2z" />
                        </svg>
                      </div>
                    </div>
                    {/* Spinning ring */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="h-20 w-20 rounded-full border-4 border-transparent border-t-steel-blue"
                        style={{ animation: "spin 1.2s linear infinite" }}
                      />
                    </div>
                    {/* Orbiting dot */}
                    <div className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full bg-pale-lime ring-2 ring-surface" />
                  </div>

                  <h3 className="mb-2 text-xl font-bold text-steel-blue">Fetching Products</h3>
                  <p className="mb-6 max-w-xs text-center text-sm text-text-muted">
                    Searching verified products from trusted suppliers...
                  </p>

                  {/* Progress bar */}
                  <div className="mb-4 w-full max-w-sm">
                    <div className="mb-2 flex items-center justify-between text-xs text-text-muted">
                      <span>Loading products...</span>
                      <span className="font-semibold text-steel-blue">92%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
                      <div className="loading-progress-bar h-2.5 rounded-full bg-linear-to-r from-steel-blue to-pale-lime" />
                    </div>
                  </div>

                  {/* Loading steps */}
                  <div className="flex items-center gap-6 text-xs text-text-muted">
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-steel-blue/20">
                        <svg
                          aria-hidden="true"
                          className="h-2.5 w-2.5 text-steel-blue"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                          <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                          <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                        </svg>
                      </div>
                      <span>Fetching catalog</span>
                    </div>
                    <div className="h-px w-8 bg-border-soft" />
                    <div className="flex items-center gap-1.5">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-steel-blue/20">
                        <svg
                          aria-hidden="true"
                          className="h-2.5 w-2.5 text-steel-blue"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.553.894l-4 2A1 1 0 016 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span>Applying filters</span>
                    </div>
                    <div className="h-px w-8 bg-border-soft" />
                    <div className="flex items-center gap-1.5 opacity-40">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-steel-blue/20">
                        <svg
                          aria-hidden="true"
                          className="h-2.5 w-2.5 text-steel-blue"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span>Ready</span>
                    </div>
                  </div>

                  {/* Bouncing dots */}
                  <div className="mt-5 flex items-center gap-1.5">
                    <div className="dot-bounce-1 h-2 w-2 rounded-full bg-steel-blue" />
                    <div className="dot-bounce-2 h-2 w-2 rounded-full bg-steel-blue" />
                    <div className="dot-bounce-3 h-2 w-2 rounded-full bg-steel-blue" />
                  </div>
                </div>
              </div>

              {/* Product card skeletons */}
              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="overflow-hidden rounded-2xl border border-border-soft bg-surface">
                    <div className="skeleton-mint h-64 w-full" />
                    <div className="space-y-3 p-6">
                      <div className="skeleton-white h-5 w-24 rounded" />
                      <div className="skeleton-white h-6 w-3/4 rounded-lg" />
                      <div className="skeleton-white h-4 w-full rounded" />
                      <div className="skeleton-white h-4 w-2/3 rounded" />
                      <div className="flex items-center gap-2">
                        <div className="skeleton-white h-4 w-24 rounded" />
                        <div className="skeleton-white h-4 w-16 rounded" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="skeleton-white h-8 w-24 rounded-lg" />
                        <div className="skeleton-white h-5 w-16 rounded" />
                      </div>
                      <div className="skeleton-white h-4 w-40 rounded" />
                      <div className="flex gap-2">
                        <div className="skeleton-white h-10 flex-1 rounded-lg" />
                        <div className="skeleton-white h-10 w-10 rounded-lg" />
                        <div className="skeleton-white h-10 w-10 rounded-lg" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination skeleton */}
              <div className="rounded-2xl border border-border-soft bg-surface p-6">
                <div className="flex flex-col items-center gap-4 lg:flex-row lg:justify-between">
                  <div className="skeleton-white h-4 w-48 rounded" />
                  <div className="flex items-center gap-2">
                    <div className="skeleton-white h-9 w-24 rounded-lg" />
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="skeleton-white h-9 w-9 rounded-lg" />
                    ))}
                    <div className="skeleton-white h-9 w-24 rounded-lg" />
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
