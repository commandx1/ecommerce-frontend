import DashboardHeader from "./components/DashboardHeader"
import GeographicDistribution from "./components/GeographicDistribution"
import InventoryStatus from "./components/InventoryStatus"
import RevenueChart from "./components/RevenueChart"
import TopSellingProducts from "./components/TopSellingProducts"
import VendorMetricsCards from "./components/VendorMetricsCards"
import VendorRecentOrders from "./components/VendorRecentOrders"

export default function VendorDashboardPage() {
  return (
    <>
      <DashboardHeader />
      <VendorMetricsCards />
      <RevenueChart />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <TopSellingProducts />
        <VendorRecentOrders />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <InventoryStatus />
        <GeographicDistribution />
      </div>
    </>
  )
}
