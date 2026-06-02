import { Download, TrendingDown, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import vendorChartsData from "@/data/vendor-charts.json"
import ActionItems from "../components/ActionItems"
import GeographicDistribution from "../components/GeographicDistribution"
import RevenueChart from "../components/RevenueChart"
import DashboardPanel from "../components/shared/DashboardPanel"
import { STATUS_TONE_CLASS_MAP } from "../components/shared/dashboardToneMaps"
import TopSellingProducts from "../components/TopSellingProducts"

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)

export default function VendorRevenuePage() {
  const revenueSeries = vendorChartsData.revenue.data
  const currentRevenue = revenueSeries[revenueSeries.length - 1] ?? 0
  const previousRevenue = revenueSeries[revenueSeries.length - 2] ?? currentRevenue
  const monthlyDelta = previousRevenue === 0 ? 0 : ((currentRevenue - previousRevenue) / previousRevenue) * 100
  const netRevenue = currentRevenue * 0.957
  const discountCost = currentRevenue * 0.084
  const refundLoss = currentRevenue * 0.043
  const margin = 34.2
  const aov = 140
  const forecast30d = Math.round(currentRevenue * 1.11)

  const kpis = [
    { label: "Total Revenue (MTD)", value: formatMoney(currentRevenue), hint: "Updated from last 30 days" },
    { label: "Net Revenue", value: formatMoney(netRevenue), hint: "After refunds and discount costs" },
    { label: "Average Order Value", value: formatMoney(aov), hint: "Per completed order" },
    { label: "Gross Margin", value: `${margin}%`, hint: "Healthy range for your category mix" },
  ]

  const channelMix = [
    { name: "Organic", share: 41, change: "+5.1%", tone: "success" },
    { name: "Repeat Customers", share: 27, change: "+3.8%", tone: "info" },
    { name: "Marketplace", share: 19, change: "-1.6%", tone: "warning" },
    { name: "Paid Campaigns", share: 13, change: "-4.2%", tone: "danger" },
  ] as const

  const revenueRisks = [
    { label: "Return Loss", value: formatMoney(refundLoss), status: "Moderate" },
    { label: "Discount Cost", value: formatMoney(discountCost), status: "Watch Closely" },
    { label: "Low-Margin SKU Exposure", value: "18% of total revenue", status: "Needs Action" },
  ]

  return (
    <>
      <section className="mb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Revenue</h1>
            <p className="mt-1 text-text-secondary">
              Revenue health, channel contribution, and leakage risks with clear next actions.
            </p>
          </div>
          <Button type="button" variant="default" className="rounded-xl px-4">
            <Download className="mr-2 h-4 w-4" />
            Export Revenue
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

      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          {monthlyDelta >= 0 ? (
            <TrendingUp className="h-4 w-4 text-success" />
          ) : (
            <TrendingDown className="h-4 w-4 text-danger" />
          )}
          <span
            className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${
              monthlyDelta >= 0 ? STATUS_TONE_CLASS_MAP.success : STATUS_TONE_CLASS_MAP.danger
            }`}
          >
            {monthlyDelta >= 0 ? "+" : ""}
            {monthlyDelta.toFixed(1)}% vs previous month
          </span>
        </div>
        <RevenueChart />
      </section>

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <DashboardPanel
          title="Revenue Breakdown"
          description="Contribution by primary acquisition and retention channels"
          contentClassName="space-y-4"
        >
          {channelMix.map((channel) => (
            <div key={channel.name}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-text-primary">{channel.name}</span>
                <span className={channel.change.startsWith("-") ? "text-danger" : "text-success"}>
                  {channel.change}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-muted">
                <div className="h-2 rounded-full bg-brand" style={{ width: `${channel.share}%` }}></div>
              </div>
              <div className="mt-1 text-xs text-text-secondary">{channel.share}% revenue share</div>
            </div>
          ))}
        </DashboardPanel>
        <GeographicDistribution />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <TopSellingProducts />
        <DashboardPanel title="Leakage & Risk" description="Revenue pressure points that reduce net contribution">
          <div className="space-y-3">
            {revenueRisks.map((risk) => (
              <div
                key={risk.label}
                className="flex items-center justify-between rounded-xl border border-border-soft bg-surface-muted/70 p-4"
              >
                <div>
                  <div className="font-medium text-text-primary">{risk.label}</div>
                  <div className="text-xs text-text-secondary">{risk.status}</div>
                </div>
                <div className="text-right font-semibold text-text-primary">{risk.value}</div>
              </div>
            ))}
          </div>
        </DashboardPanel>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <ActionItems />
        <DashboardPanel title="30-Day Forecast" description="Baseline estimate from current trend and conversion mix">
          <div className="rounded-xl border border-success/20 bg-success/10 p-4">
            <div className="text-sm text-text-secondary">Projected Revenue</div>
            <div className="mt-1 text-3xl font-bold text-text-primary">{formatMoney(forecast30d)}</div>
            <div className="mt-2 inline-flex rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs text-success">
              +11% expected if current pace holds
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm text-text-secondary">
            <p>Prioritize low-margin SKU pricing updates to protect net revenue.</p>
            <p>Shift 10-15% ad budget from underperforming channels to high-repeat segments.</p>
            <p>Set weekly refund review for top 20 revenue-generating SKUs.</p>
          </div>
        </DashboardPanel>
      </div>
    </>
  )
}
