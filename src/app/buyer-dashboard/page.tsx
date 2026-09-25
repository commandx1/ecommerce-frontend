import { redirect } from "next/navigation"

// Overview dummy veriyle çalıştığı için gizlendi; JSX features/buyer-dashboard/overview/BuyerOverview.tsx'te duruyor.
// Backend'e bağlanınca burayı <BuyerOverview /> render edecek şekilde geri al.
export default function BuyerDashboardPage() {
  redirect("/buyer-dashboard/orders")
}
