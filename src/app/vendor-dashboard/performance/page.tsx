import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import ActionItems from "../components/ActionItems"
import InventoryStatus from "../components/InventoryStatus"
import QuickStats from "../components/QuickStats"
import SalesPerformanceChart from "../components/SalesPerformanceChart"
import TopSellingProducts from "../components/TopSellingProducts"
import VendorRecentOrders from "../components/VendorRecentOrders"

export default function VendorPerformancePage() {
  return (
    <>
      <section className="mb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Performance</h1>
            <p className="mt-1 text-text-secondary">
              Monitor sales targets, order velocity, stock risk, and execution priorities.
            </p>
          </div>
          <Button type="button" variant="default" className="rounded-xl px-4">
            <Download className="mr-2 h-4 w-4" />
            Export Performance
          </Button>
        </div>
      </section>

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <SalesPerformanceChart />
        <InventoryStatus />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <TopSellingProducts />
        <VendorRecentOrders />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <ActionItems />
        <QuickStats />
      </div>
    </>
  )
}
