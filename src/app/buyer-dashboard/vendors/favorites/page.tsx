import { redirect } from "next/navigation"

export default function BuyerDashboardFavoriteVendorsRoute() {
  redirect("/buyer-dashboard/favorites?tab=vendors")
}
