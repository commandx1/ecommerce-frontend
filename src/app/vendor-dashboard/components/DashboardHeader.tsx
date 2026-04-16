import { Download } from "lucide-react"
import { useId } from "react"
import { Button } from "@/components/ui/button"

const DashboardHeader = () => {
  const sectionId = useId()
  const lastUpdated = "2 minutes ago"

  return (
    <section id={sectionId} className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Vendor Dashboard</h1>
          <p className="mt-1 text-text-secondary">
            Welcome back, DentalPro Supply. Here&apos;s your business overview.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-text-secondary">Last updated</div>
            <div className="text-sm font-semibold text-text-primary">{lastUpdated}</div>
          </div>
          <Button type="button" variant="default" className="rounded-xl px-4">
            <Download className="mr-2 w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>
    </section>
  )
}

export default DashboardHeader
