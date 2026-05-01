import { ArrowLeft, Mail, MapPin, PhoneCall } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import formatCurrency from "@/lib/helpers/formatCurrency"
import DashboardPanel from "../../components/shared/DashboardPanel"
import { STATUS_TONE_CLASS_MAP } from "../../components/shared/dashboardToneMaps"
import CustomerRevenueTrend from "../components/CustomerRevenueTrend"
import { formatLastOrder, getCustomerById } from "../data"

interface CustomerProfilePageProps {
  params: Promise<{
    customerId: string
  }>
}

const healthToneMap = {
  Healthy: STATUS_TONE_CLASS_MAP.success,
  "Needs Attention": STATUS_TONE_CLASS_MAP.warning,
  Dormant: STATUS_TONE_CLASS_MAP.danger,
} as const

const segmentToneMap = {
  "High Value": STATUS_TONE_CLASS_MAP.success,
  Growth: STATUS_TONE_CLASS_MAP.info,
  "At Risk": STATUS_TONE_CLASS_MAP.warning,
  New: STATUS_TONE_CLASS_MAP.neutral,
} as const

export default async function CustomerProfilePage({ params }: CustomerProfilePageProps) {
  const { customerId } = await params
  const customer = getCustomerById(customerId)

  if (!customer) {
    notFound()
  }

  const expectedLtv = customer.totalSpend * (1 + customer.returnRate / 100)
  const recentOrders = Array.from({ length: 5 }).map((_, index) => ({
    id: `${customer.id}-order-${index + 1}`,
    orderNumber: `#${String(4200 + customer.orders + index).padStart(5, "0")}`,
    amount: customer.averageOrderValue * (1 + index * 0.08),
    daysAgo: customer.lastOrderDaysAgo + index * 7,
    status: index < 2 ? "Completed" : index === 2 ? "Processing" : "Shipped",
  }))

  return (
    <>
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <Link
            href="/vendor-dashboard/customers/all"
            className="inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all customers
          </Link>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">{customer.name}</h1>
            <p className="mt-1 text-text-secondary">{customer.clinicName}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex rounded-full border px-2 py-1 text-xs ${segmentToneMap[customer.segment]}`}>
              {customer.segment}
            </span>
            <span className={`inline-flex rounded-full border px-2 py-1 text-xs ${healthToneMap[customer.health]}`}>
              {customer.health}
            </span>
          </div>
        </div>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border-soft bg-surface-elevated p-5 shadow-soft">
          <div className="text-sm text-text-secondary">Total Spend</div>
          <div className="mt-2 text-2xl font-bold text-text-primary">{formatCurrency(customer.totalSpend)}</div>
        </div>
        <div className="rounded-2xl border border-border-soft bg-surface-elevated p-5 shadow-soft">
          <div className="text-sm text-text-secondary">Average Order Value</div>
          <div className="mt-2 text-2xl font-bold text-text-primary">{formatCurrency(customer.averageOrderValue)}</div>
        </div>
        <div className="rounded-2xl border border-border-soft bg-surface-elevated p-5 shadow-soft">
          <div className="text-sm text-text-secondary">Return Rate</div>
          <div className="mt-2 text-2xl font-bold text-text-primary">{customer.returnRate}%</div>
        </div>
        <div className="rounded-2xl border border-border-soft bg-surface-elevated p-5 shadow-soft">
          <div className="text-sm text-text-secondary">Expected Lifetime Value</div>
          <div className="mt-2 text-2xl font-bold text-text-primary">{formatCurrency(expectedLtv)}</div>
        </div>
      </section>

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <DashboardPanel title="Customer Contact" description="Primary account details and location">
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-border-soft bg-surface-muted/70 p-3">
              <Mail className="h-4 w-4 text-brand" />
              <span className="text-sm text-text-primary">{customer.email}</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border-soft bg-surface-muted/70 p-3">
              <PhoneCall className="h-4 w-4 text-brand" />
              <span className="text-sm text-text-secondary">+1 (555) 101-23{customer.orders}</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border-soft bg-surface-muted/70 p-3">
              <MapPin className="h-4 w-4 text-brand" />
              <span className="text-sm text-text-primary">
                {customer.city}, {customer.state}
              </span>
            </div>
            <div className="rounded-xl border border-border-soft bg-surface-muted/70 p-3 text-sm text-text-secondary">
              Last order: {formatLastOrder(customer.lastOrderDaysAgo)} • {customer.orders} lifetime orders
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Spend Trend" description="Recent purchasing momentum">
          <CustomerRevenueTrend monthlyRevenue={customer.monthlyRevenue} />
        </DashboardPanel>

        <DashboardPanel title="Recommended Actions" description="Actions to improve retention and contribution">
          <div className="space-y-3 text-sm">
            <div className="rounded-xl border border-border-soft bg-surface-muted/70 p-3 text-text-secondary">
              Send a personalized replenishment reminder before next likely order window.
            </div>
            <div className="rounded-xl border border-border-soft bg-surface-muted/70 p-3 text-text-secondary">
              Propose category bundle aligned with top recurring SKUs for this clinic profile.
            </div>
            <div className="rounded-xl border border-border-soft bg-surface-muted/70 p-3 text-text-secondary">
              Trigger quarterly account review if inactivity exceeds 21 days.
            </div>
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel title="Recent Order Snapshot" description="Operational timeline for the most recent transactions">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-border-soft">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-border-soft/80">
                  <td className="px-4 py-3 font-medium text-text-primary">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-text-primary">{formatCurrency(order.amount)}</td>
                  <td className="px-4 py-3 text-text-secondary">{formatLastOrder(order.daysAgo)}</td>
                  <td className="px-4 py-3 text-text-secondary">{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardPanel>
    </>
  )
}
