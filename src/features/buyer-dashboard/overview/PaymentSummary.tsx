import { CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import dashboardInvoicesData from "@/data/dashboard-invoices.json"

const PaymentSummary = () => {
  return (
    <div className="rounded-xl border border-border-soft bg-surface-elevated shadow-soft">
      <div className="border-b border-border-soft p-6">
        <h2 className="text-xl font-semibold text-text-primary">Payment Summary</h2>
        <p className="mt-1 text-sm text-text-secondary">Current month overview</p>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-surface-muted/60 p-4 text-center">
            <div className="text-2xl font-bold text-text-primary">
              {dashboardInvoicesData.paymentSummary.totalSpent}
            </div>
            <div className="mt-1 text-sm text-text-secondary">Total Spent</div>
          </div>
          <div className="rounded-lg bg-surface-muted/60 p-4 text-center">
            <div className="text-2xl font-bold text-text-primary">
              {dashboardInvoicesData.paymentSummary.outstanding}
            </div>
            <div className="mt-1 text-sm text-text-secondary">Outstanding</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-primary">Payment Methods</span>
          </div>

          {dashboardInvoicesData.paymentSummary.paymentMethods.map((method) => {
            const iconColorClass =
              method.iconColor === "blue"
                ? "bg-brand/15"
                : method.iconColor === "orange"
                  ? "bg-warning/20"
                  : "bg-surface-muted"
            const textColorClass =
              method.iconColor === "blue"
                ? "text-brand"
                : method.iconColor === "orange"
                  ? "text-warning"
                  : "text-text-secondary"

            return (
              <div
                key={method.id}
                className="flex items-center justify-between rounded-lg border border-border-soft p-3"
              >
                <div className="flex items-center space-x-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded ${iconColorClass}`}>
                    <CreditCard className={`h-4 w-4 ${textColorClass}`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-text-primary">**** {method.last4}</div>
                    <div className="text-xs text-text-muted">{method.label}</div>
                  </div>
                </div>
                <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs">
                  Edit
                </Button>
              </div>
            )
          })}

          <Button type="button" variant="outline" className="w-full rounded-lg">
            + Add Payment Method
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PaymentSummary
