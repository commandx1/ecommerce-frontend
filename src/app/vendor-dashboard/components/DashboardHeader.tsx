import { Download } from "lucide-react"

const DashboardHeader = () => {
  const lastUpdated = "2 minutes ago"

  return (
    <section id="dashboard-header" className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-steel-blue">Vendor Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, DentalPro Supply. Here&apos;s your business overview.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-600">Last updated</div>
            <div className="text-sm font-semibold text-steel-blue">{lastUpdated}</div>
          </div>
          <button
            type="button"
            className="bg-steel-blue text-white px-4 py-2 rounded-lg hover:bg-opacity-90 font-medium flex items-center"
          >
            <Download className="mr-2 w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>
    </section>
  )
}

export default DashboardHeader
