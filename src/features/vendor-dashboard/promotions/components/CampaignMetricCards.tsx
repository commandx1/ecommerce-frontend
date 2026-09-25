import { BarChart3, Megaphone, Sparkles, Target } from "lucide-react"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { cn } from "@/lib/utils"
import type { CampaignKpiSnapshot } from "../lib/promotion-filters"

interface MetricCardProps {
  label: string
  value: string
  icon: React.ReactNode
  tone: "success" | "warning" | "info" | "neutral"
}

function MetricCard({ label, value, icon, tone }: MetricCardProps) {
  const toneMap = {
    success: "border-success/20 bg-success/8",
    warning: "border-warning/24 bg-warning/8",
    info: "border-brand/20 bg-brand/8",
    neutral: "border-border-soft bg-(--glass-tile)",
  }

  return (
    <div className={cn("rounded-2xl border p-4 shadow-soft", toneMap[tone])}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-text-secondary">{label}</span>
        <span className="text-text-secondary">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-text-primary">{value}</div>
    </div>
  )
}

interface CampaignMetricCardsProps {
  kpiSnapshot: CampaignKpiSnapshot
}

export default function CampaignMetricCards({ kpiSnapshot }: CampaignMetricCardsProps) {
  return (
    <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-6">
      <MetricCard
        label="Active Campaigns"
        value={String(kpiSnapshot.activeCampaigns)}
        tone="success"
        icon={<Megaphone />}
      />
      <MetricCard label="Spend" value={formatCurrency(kpiSnapshot.spend)} tone="warning" icon={<Target />} />
      <MetricCard
        label="Attributed Revenue"
        value={formatCurrency(kpiSnapshot.revenue)}
        tone="info"
        icon={<Sparkles />}
      />
      <MetricCard label="ROAS" value={`${kpiSnapshot.roas.toFixed(2)}x`} tone="success" icon={<BarChart3 />} />
      <MetricCard label="CTR" value={`${kpiSnapshot.ctr.toFixed(2)}%`} tone="neutral" icon={<Target />} />
      <MetricCard label="Conversions" value={String(kpiSnapshot.conversions)} tone="info" icon={<Sparkles />} />
    </section>
  )
}
