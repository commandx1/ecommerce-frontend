import DashboardPanel from "../../components/shared/DashboardPanel"
import { DOT_TONE_CLASS_MAP, STATUS_TONE_CLASS_MAP } from "../../components/shared/dashboardToneMaps"
import { getCustomerSegmentDistribution } from "../data"

const segmentToneMap: Record<string, { badge: string; dot: string }> = {
  "High Value": { badge: STATUS_TONE_CLASS_MAP.success, dot: DOT_TONE_CLASS_MAP.success },
  Growth: { badge: STATUS_TONE_CLASS_MAP.info, dot: DOT_TONE_CLASS_MAP.info },
  "At Risk": { badge: STATUS_TONE_CLASS_MAP.warning, dot: DOT_TONE_CLASS_MAP.warning },
  New: { badge: STATUS_TONE_CLASS_MAP.neutral, dot: DOT_TONE_CLASS_MAP.neutral },
}

export default function CustomerSegmentsCard() {
  const segments = getCustomerSegmentDistribution()

  return (
    <DashboardPanel title="Customer Segments" description="Distribution by lifecycle and value profile">
      <div className="space-y-4">
        {segments.map((segmentRow) => {
          const tone = segmentToneMap[segmentRow.segment]
          return (
            <div key={segmentRow.segment}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`}></span>
                  <span className="text-sm font-medium text-text-primary">{segmentRow.segment}</span>
                </div>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${tone.badge}`}>
                  {segmentRow.count} customers
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-muted">
                <div className={`h-2 rounded-full ${tone.dot}`} style={{ width: `${segmentRow.share}%` }}></div>
              </div>
              <div className="mt-1 text-xs text-text-secondary">{segmentRow.share}% share</div>
            </div>
          )
        })}
      </div>
    </DashboardPanel>
  )
}
