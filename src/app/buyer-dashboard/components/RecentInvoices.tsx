import { FileText } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import dashboardInvoicesData from "@/data/dashboard-invoices.json"

const statusColorMap: Record<string, string> = {
  green: "bg-success/15 text-success",
  "coral-orange": "bg-coral-orange/20 text-coral-orange",
}

const RecentInvoices = () => {
  return (
    <div className="rounded-xl border border-border-soft bg-surface-elevated shadow-soft">
      <div className="border-b border-border-soft p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">Recent Invoices</h2>
          <Link href="/invoices" className="font-medium text-brand hover:underline">
            View All
          </Link>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {dashboardInvoicesData.recentInvoices.map((invoice) => {
            const statusColorClass = statusColorMap[invoice.statusColor] || "bg-surface-muted text-text-secondary"

            return (
              <div key={invoice.id} className="flex items-center justify-between rounded-lg bg-surface-muted/55 p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-elevated">
                    <FileText className="h-5 w-5 text-brand" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{invoice.id}</h3>
                    <p className="text-xs text-text-secondary">
                      {invoice.date} • {invoice.supplier}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-text-primary">{invoice.amount}</div>
                  <div className="flex items-center space-x-2">
                    <span className={`${statusColorClass} text-xs px-2 py-1 rounded-full`}>{invoice.status}</span>
                    <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs">
                      {invoice.action}
                    </Button>
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
