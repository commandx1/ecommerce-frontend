import PageSectionContainer from "@/components/layout/PageSectionContainer"
import { Skeleton } from "@/components/ui/skeleton"

// `/categories` is the only one of the catalogue routes whose page component actually awaits on
// the server (`await getProductCategoryOptions()` behind `revalidate = 3600`), so this fallback
// really does get painted on a cold request. /cart, /checkout and /vendors render synchronously
// and do their fetching client-side, which is why they deliberately have no loading.tsx.
export default function CategoriesLoading() {
  return (
    <main className="min-h-screen bg-canvas">
      {/* Same text as CategoriesPage's own sr-only h1, so swapping the skeleton for the real page
          never leaves a moment with zero or a mismatched page heading - same reasoning as
          src/app/products/loading.tsx. */}
      <h1 className="sr-only">Dental Supply Categories</h1>

      <PageSectionContainer as="section" className="py-8 lg:py-12">
        <div aria-busy="true">
          {/* Search field: label line + the h-11 rounded-full input from CategoryDirectory. */}
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="mt-2 h-11 w-full rounded-full md:w-[28rem]" />

          {/* a11y: the root layout's persistent <Footer> renders its own <h3>s regardless of which
              page content is showing, including this skeleton. With nothing between the sr-only h1
              above and that footer, a scan landing here would see a straight h1 -> h3 jump. This
              sr-only h2 stands in for the real page's "All categories" h2 and bridges the gap. */}
          <h2 className="sr-only">Loading categories</h2>
          <Skeleton className="mt-8 h-8 w-44" />

          {/* Tile grid. Eight covers roughly the first two rows at the widest breakpoint; the real
              directory renders every entry, so the tail grows in below the fold rather than
              shifting what the viewer is already looking at. */}
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((tile) => (
              <li key={tile}>
                <div className="h-full overflow-hidden rounded-[1.75rem] bg-surface-elevated shadow-soft">
                  {/* CategoryTile's image sits in an aspect-[5/4] box with a count pill over it. */}
                  <div className="relative aspect-[5/4] w-full overflow-hidden bg-skeleton-base">
                    <Skeleton className="absolute left-4 top-4 h-7 w-20 rounded-full" />
                  </div>
                  <div className="flex items-start justify-between gap-3 px-5 pb-5 pt-1">
                    <Skeleton className="mt-1 h-6 w-32" />
                    <Skeleton className="mt-0.5 h-9 w-9 shrink-0 rounded-full" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </PageSectionContainer>
    </main>
  )
}
