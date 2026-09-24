import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import FavoritesPage from "@/features/favorites/FavoritesPage"
import ProductCardSkeleton from "@/features/products/listing/components/listing/ProductCardSkeleton"

// Mirrors FavoritesPage's header + tabs + product grid so the Suspense boundary doesn't flash
// blank while the client component (useSearchParams) mounts. Heading text is deliberately not
// "Favorites" — the e2e page object binds on that exact accessible name once the real page mounts.
function FavoritesFallback() {
  return (
    <section aria-busy="true">
      <h1 className="sr-only">Loading Favorites</h1>
      <div className="mb-8 flex flex-col gap-5">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-12 w-56 rounded-full" />
      </div>
      <div className="@container">
        <div className="grid grid-cols-1 gap-5 @xl:grid-cols-2 @3xl:grid-cols-3 @min-[69rem]:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default function BuyerDashboardFavoritesRoute() {
  return (
    <Suspense fallback={<FavoritesFallback />}>
      <FavoritesPage />
    </Suspense>
  )
}
