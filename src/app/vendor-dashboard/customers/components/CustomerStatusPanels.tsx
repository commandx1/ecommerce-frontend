import DashboardPanel from "../../components/shared/DashboardPanel"
import { formatLastOrder, type VendorCustomer } from "../data"

interface CustomerStatusPanelsProps {
  customers: VendorCustomer[]
}

export default function CustomerStatusPanels({ customers }: CustomerStatusPanelsProps) {
  const needsAttention = customers
    .filter((customer) => customer.health !== "Healthy")
    .sort((a, b) => b.lastOrderDaysAgo - a.lastOrderDaysAgo)
    .slice(0, 4)

  const highPotential = customers
    .filter((customer) => customer.segment === "Growth" || customer.segment === "New")
    .sort((a, b) => b.returnRate - a.returnRate)
    .slice(0, 4)

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <DashboardPanel title="Needs Attention" description="Accounts at risk of churn or prolonged inactivity">
        <div className="space-y-3">
          {needsAttention.map((customer) => (
            <div
              key={customer.id}
              className="flex items-center justify-between rounded-xl border border-border-soft bg-surface-muted/70 p-3"
            >
              <div>
                <div className="font-medium text-text-primary">{customer.name}</div>
                <div className="text-xs text-text-secondary">
                  {customer.clinicName} • last order {formatLastOrder(customer.lastOrderDaysAgo)}
                </div>
              </div>
              <div className="text-sm font-semibold text-danger">{customer.health}</div>
            </div>
          ))}
        </div>
      </DashboardPanel>

      <DashboardPanel title="High Potential" description="Accounts with high repeat probability and scaling potential">
        <div className="space-y-3">
          {highPotential.map((customer) => (
            <div
              key={customer.id}
              className="flex items-center justify-between rounded-xl border border-border-soft bg-surface-muted/70 p-3"
            >
              <div>
                <div className="font-medium text-text-primary">{customer.name}</div>
                <div className="text-xs text-text-secondary">
                  {customer.clinicName} • {customer.segment}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-success">{customer.returnRate}% return rate</div>
                <div className="text-xs text-text-secondary">{customer.orders} orders</div>
              </div>
            </div>
          ))}
        </div>
      </DashboardPanel>
    </div>
  )
}
