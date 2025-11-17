import { FileText } from "lucide-react"
import Link from "next/link"
import dashboardInvoicesData from "@/data/dashboard-invoices.json"

const statusColorMap: Record<string, string> = {
  green: "bg-green-100 text-green-700",
  "coral-orange": "bg-coral-orange/20 text-coral-orange",
}

const RecentInvoices = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-steel-blue">Recent Invoices</h2>
          <Link href="/invoices" className="text-steel-blue hover:underline font-medium">
            View All
          </Link>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {dashboardInvoicesData.recentInvoices.map((invoice) => {
            const statusColorClass = statusColorMap[invoice.statusColor] || "bg-gray-100 text-gray-700"

            return (
              <div key={invoice.id} className="flex items-center justify-between p-4 bg-light-mint-gray rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <FileText className="text-steel-blue w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-steel-blue text-sm">{invoice.id}</h3>
                    <p className="text-xs text-gray-600">
                      {invoice.date} • {invoice.supplier}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-steel-blue">{invoice.amount}</div>
                  <div className="flex items-center space-x-2">
                    <span className={`${statusColorClass} text-xs px-2 py-1 rounded-full`}>{invoice.status}</span>
                    <button type="button" className="text-steel-blue hover:underline text-xs">
                      {invoice.action}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default RecentInvoices
