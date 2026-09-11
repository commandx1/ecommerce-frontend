import { redirect } from "next/navigation"

export default function BuyerDashboardVendorsRoute() {
  redirect("/buyer-dashboard/favorites?tab=vendors")
}
