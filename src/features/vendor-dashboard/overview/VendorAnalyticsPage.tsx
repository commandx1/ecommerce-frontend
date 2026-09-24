import { Download } from "lucide-react"
import SectionHeading from "@/components/layout/SectionHeading"
import { Button } from "@/components/ui/button"
import CustomerAnalyticsChart from "./components/CustomerAnalyticsChart"
import GeographicDistribution from "./components/GeographicDistribution"
import MarketingPerformance from "./components/MarketingPerformance"
import RevenueChart from "./components/RevenueChart"
import VendorMetricsCards from "./components/VendorMetricsCards"

export default function VendorAnalyticsPage() {
  return (
    <>
      <section className="mb-8">
        <SectionHeading
          titleAs="h1"
          variant="technical"
          title="Analytics"
          description="Track revenue, customers, demand regions, and campaign health in one place."
          actions={
            <Button type="button" variant="default" className="rounded-xl px-4">
              <Download className="mr-2 h-4 w-4" />
              Export Analytics
            </Button>
          }
        />
      </section>

      <VendorMetricsCards />
      <div className="mb-8">
        <RevenueChart />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <CustomerAnalyticsChart />
        <GeographicDistribution />
      </div>

      <MarketingPerformance />
    </>
  )
}
