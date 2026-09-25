import { Suspense } from "react"
import FavoritesPageFallback from "@/features/favorites/components/FavoritesPageFallback"
import FavoritesPage from "@/features/favorites/FavoritesPage"

export default function BuyerDashboardFavoritesRoute() {
  return (
    <Suspense fallback={<FavoritesPageFallback />}>
      <FavoritesPage />
    </Suspense>
  )
}
