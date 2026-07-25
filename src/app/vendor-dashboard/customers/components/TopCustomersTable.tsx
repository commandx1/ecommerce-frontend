import { ArrowRight } from "lucide-react"
import Link from "next/link"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { cn } from "@/lib/utils"
import { STATUS_TONE_CLASS_MAP } from "../../components/shared/dashboardToneMaps"
import { formatLastOrder, type VendorCustomer } from "../data"

interface TopCustomersTableProps {
  customers: VendorCustomer[]
  title: string
  description: string
  action?: React.ReactNode
}

const healthToneMap: Record<VendorCustomer["health"], string> = {
  Healthy: STATUS_TONE_CLASS_MAP.success,
  "Needs Attention": STATUS_TONE_CLASS_MAP.warning,
  Dormant: STATUS_TONE_CLASS_MAP.danger,
}

export default function TopCustomersTable({ customers, title, description, action }: TopCustomersTableProps) {
  return (
    <section className="rounded-4xl border border-border-soft bg-surface shadow-soft">
      <div className="mb-1 flex items-center justify-between gap-4 border-b border-border-soft px-6 py-5">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        </div>
        {action}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-225">
          <thead className="bg-surface-muted/65">
            <tr>
              <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Customer
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Orders
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Total Spend
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                AOV
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Return Rate
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Last Order
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Status
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-t border-border-soft">
                <td className="px-6 py-4 text-center">
                  <div className="font-medium text-text-primary">{customer.name}</div>
                  <div className="text-sm text-text-secondary">
                    {customer.clinicName} • {customer.city}, {customer.state}
                  </div>
                </td>
                <td className="px-6 py-4 text-center text-text-primary">{customer.orders}</td>
                <td className="px-6 py-4 text-center font-semibold text-text-primary">
                  {formatCurrency(customer.totalSpend)}
                </td>
                <td className="px-6 py-4 text-center text-text-primary">
                  {formatCurrency(customer.averageOrderValue)}
                </td>
                <td className="px-6 py-4 text-center text-text-primary">{customer.returnRate}%</td>
                <td className="px-6 py-4 text-center text-text-secondary">
                  {formatLastOrder(customer.lastOrderDaysAgo)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2 py-0.5 text-xs",
                      healthToneMap[customer.health],
                    )}
                  >
                    {customer.health}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <Link
                    href={`/vendor-dashboard/customers/${customer.id}`}
                    className="inline-flex items-center justify-center gap-1 text-sm font-medium text-brand transition-colors hover:text-brand-strong"
                  >
                    View Profile
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
