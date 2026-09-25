import DashboardPanel from "@/app/vendor-dashboard/components/shared/DashboardPanel"
import { formatNumber } from "@/lib/helpers/format"
import { cn } from "@/lib/utils"
import type { CampaignKpiSnapshot } from "../lib/promotion-filters"

interface FunnelRowProps {
  label: string
  value: number
  width: number
  color: string
}

function FunnelRow({ label, value, width, color }: FunnelRowProps) {
  const safeWidth = Math.max(8, Math.min(100, width))

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className="font-medium text-text-primary">{formatNumber(value)}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-surface-muted">
        <div className={cn("h-2 rounded-full", color)} style={{ width: `${safeWidth}%` }}></div>
      </div>
    </div>
  )
}

interface ConversionFunnelPanelProps {
  kpiSnapshot: CampaignKpiSnapshot
}

export default function ConversionFunnelPanel({ kpiSnapshot }: ConversionFunnelPanelProps) {
  return (
    <DashboardPanel title="Conversion Funnel" description="Impressions to conversions across non-archived campaigns">
      <div className="space-y-3">
        <FunnelRow label="Impressions" value={kpiSnapshot.impressions} color="bg-brand" width={100} />
        <FunnelRow
          label="Clicks"
          value={kpiSnapshot.clicks}
          color="bg-success"
          width={kpiSnapshot.impressions > 0 ? (kpiSnapshot.clicks / kpiSnapshot.impressions) * 100 : 0}
        />
        <FunnelRow
          label="Conversions"
          value={kpiSnapshot.conversions}
          color="bg-warning"
          width={kpiSnapshot.clicks > 0 ? (kpiSnapshot.conversions / kpiSnapshot.clicks) * 100 : 0}
        />
      </div>
    </DashboardPanel>
  )
}
