import ActionItems from "./components/ActionItems"
import CustomerAnalyticsChart from "./components/CustomerAnalyticsChart"
import DashboardHeader from "./components/DashboardHeader"
import GeographicDistribution from "./components/GeographicDistribution"
import InventoryStatus from "./components/InventoryStatus"
import MarketingPerformance from "./components/MarketingPerformance"
import QuickStats from "./components/QuickStats"
import RevenueChart from "./components/RevenueChart"
import SalesPerformanceChart from "./components/SalesPerformanceChart"
import TopSellingProducts from "./components/TopSellingProducts"
import VendorHeader from "./components/VendorHeader"
import VendorMetricsCards from "./components/VendorMetricsCards"
import VendorNotifications from "./components/VendorNotifications"
import VendorRecentOrders from "./components/VendorRecentOrders"
import VendorSidebar from "./components/VendorSidebar"

export default function VendorDashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-light-mint-gray">
      <VendorHeader />
      <div className="flex flex-1">
        <VendorSidebar />
        <main id="main-content" className="flex-1 p-8">
          <DashboardHeader />
          <VendorMetricsCards />
          <RevenueChart />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <SalesPerformanceChart />
            <InventoryStatus />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <TopSellingProducts />
            <VendorRecentOrders />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <CustomerAnalyticsChart />
            <GeographicDistribution />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <MarketingPerformance />
            <VendorNotifications />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <ActionItems />
            <QuickStats />
          </div>
        </main>
      </div>
    </div>
  )
}
