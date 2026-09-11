import { redirect } from "next/navigation"

export default function BuyerDashboardSuppliersLegacyRoute() {
  redirect("/buyer-dashboard/favorites?tab=vendors")
}
