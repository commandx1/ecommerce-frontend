import { Suspense } from "react"
import FavoritesPage from "@/features/favorites/FavoritesPage"

export default function BuyerDashboardFavoritesRoute() {
  return (
    <Suspense fallback={null}>
      <FavoritesPage />
    </Suspense>
  )
}
