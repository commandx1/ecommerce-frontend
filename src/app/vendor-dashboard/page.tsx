import VendorWelcomeHeader from "@/features/vendor-dashboard/shell/VendorWelcomeHeader"
import GeographicDistribution from "./components/GeographicDistribution"
import InventoryStatus from "./components/InventoryStatus"
import RevenueChart from "./components/RevenueChart"
import TopSellingProducts from "./components/TopSellingProducts"
import VendorMetricsCards from "./components/VendorMetricsCards"
import VendorRecentOrders from "./components/VendorRecentOrders"

export default function VendorDashboardPage() {
  return (
    <>
      <VendorWelcomeHeader />
      <VendorMetricsCards />
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 *:h-full xl:col-span-8">
          <RevenueChart />
        </div>
        <div className="col-span-12 *:h-full xl:col-span-4">
          <InventoryStatus />
        </div>
        <div className="col-span-12 *:h-full xl:col-span-6">
          <TopSellingProducts />
        </div>
        <div className="col-span-12 *:h-full xl:col-span-6">
          <VendorRecentOrders />
        </div>
        <div className="col-span-12">
          <GeographicDistribution />
        </div>
      </div>
    </>
  )
}
