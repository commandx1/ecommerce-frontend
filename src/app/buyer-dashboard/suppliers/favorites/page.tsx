import { redirect } from "next/navigation"

export default function BuyerDashboardFavoriteSuppliersLegacyRoute() {
  redirect("/buyer-dashboard/favorites?tab=vendors")
}
