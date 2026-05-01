import { Download } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import formatCurrency from "@/lib/helpers/formatCurrency"
import CustomerAnalyticsChart from "../components/CustomerAnalyticsChart"
import CustomerSegmentsCard from "./components/CustomerSegmentsCard"
import CustomerStatusPanels from "./components/CustomerStatusPanels"
import TopCustomersTable from "./components/TopCustomersTable"
import { VENDOR_CUSTOMERS } from "./data"

export default function VendorCustomersPage() {
  const topCustomers = [...VENDOR_CUSTOMERS].sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 20)
  const totalRevenue = VENDOR_CUSTOMERS.reduce((sum, customer) => sum + customer.totalSpend, 0)
  const avgCustomerValue = totalRevenue / VENDOR_CUSTOMERS.length
  const avgReturningRate =
    VENDOR_CUSTOMERS.reduce((sum, customer) => sum + customer.returnRate, 0) / VENDOR_CUSTOMERS.length
  const newCustomers = VENDOR_CUSTOMERS.filter((customer) => customer.segment === "New").length
  const activeCustomers = VENDOR_CUSTOMERS.filter((customer) => customer.health !== "Dormant").length

  const kpis = [
    { label: "Active Customers", value: String(activeCustomers), hint: "Healthy + attention-needed accounts" },
    { label: "New Customers (30d)", value: String(newCustomers), hint: "Recently onboarded accounts" },
    { label: "Returning Rate", value: `${avgReturningRate.toFixed(1)}%`, hint: "Average reorder propensity" },
    { label: "Avg Customer Value", value: formatCurrency(avgCustomerValue), hint: "Total spend per account" },
  ]

  return (
    <>
      <section className="mb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Customers</h1>
            <p className="mt-1 text-text-secondary">
              Analyze customer behavior and act on key accounts from a single hybrid workspace.
            </p>
          </div>
          <Button type="button" variant="default" className="rounded-xl px-4">
            <Download className="mr-2 h-4 w-4" />
            Export Customers
          </Button>
        </div>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-border-soft bg-surface-elevated p-5 shadow-soft">
            <div className="text-sm text-text-secondary">{kpi.label}</div>
            <div className="mt-2 text-2xl font-bold text-text-primary">{kpi.value}</div>
            <div className="mt-1 text-xs text-text-muted">{kpi.hint}</div>
          </div>
        ))}
      </section>

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <CustomerAnalyticsChart />
        <CustomerSegmentsCard />
      </div>

      <div className="mb-8">
        <TopCustomersTable
          customers={topCustomers}
          title="Top 20 Customers"
          description="Prioritized by total spend and account health signals"
          action={
            <Link
              href="/vendor-dashboard/customers/all"
              className="text-sm font-medium text-brand transition-colors hover:text-brand-strong"
            >
              View All
            </Link>
          }
        />
      </div>

      <CustomerStatusPanels customers={VENDOR_CUSTOMERS} />
    </>
  )
}
