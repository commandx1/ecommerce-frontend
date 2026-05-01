import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import CustomerAnalyticsChart from "../components/CustomerAnalyticsChart"
import GeographicDistribution from "../components/GeographicDistribution"
import MarketingPerformance from "../components/MarketingPerformance"
import RevenueChart from "../components/RevenueChart"
import VendorMetricsCards from "../components/VendorMetricsCards"
import VendorNotifications from "../components/VendorNotifications"

export default function VendorAnalyticsPage() {
  return (
    <>
      <section className="mb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Analytics</h1>
            <p className="mt-1 text-text-secondary">
              Track revenue, customers, demand regions, and campaign health in one place.
            </p>
          </div>
          <Button type="button" variant="default" className="rounded-xl px-4">
            <Download className="mr-2 h-4 w-4" />
            Export Analytics
          </Button>
        </div>
      </section>

      <VendorMetricsCards />
      <RevenueChart />

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <CustomerAnalyticsChart />
        <GeographicDistribution />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <MarketingPerformance />
        <VendorNotifications />
      </div>
    </>
  )
}
