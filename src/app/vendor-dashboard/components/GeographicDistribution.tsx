import { Expand } from "lucide-react"
import vendorGeographicData from "@/data/vendor-geographic.json"
import DashboardPanel from "./shared/DashboardPanel"
import { DOT_TONE_CLASS_MAP } from "./shared/dashboardToneMaps"

const colorMap: Record<string, string> = {
  "steel-blue": DOT_TONE_CLASS_MAP.info,
  blue: DOT_TONE_CLASS_MAP.info,
  green: DOT_TONE_CLASS_MAP.success,
  yellow: DOT_TONE_CLASS_MAP.warning,
  purple: "bg-brand-strong",
  gray: DOT_TONE_CLASS_MAP.neutral,
}

const GeographicDistribution = () => {
  return (
    <DashboardPanel
      title="Geographic Distribution"
      action={
        <button type="button" className="text-text-muted transition-colors hover:text-brand">
          <Expand className="w-4 h-4" />
        </button>
      }
    >
      <div className="space-y-4">
        {vendorGeographicData.regions.map((region) => {
          const dotColor = colorMap[region.color] || DOT_TONE_CLASS_MAP.neutral
          const barColor = colorMap[region.color] || DOT_TONE_CLASS_MAP.neutral

          return (
            <div key={region.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 ${dotColor} rounded-full mr-3`}></div>
                <span className="text-sm font-medium text-text-primary">{region.name}</span>
              </div>
              <div className="flex items-center">
                <div className="mr-3 h-2 w-20 rounded-full bg-surface-muted">
                  <div
                    className={`${barColor} h-2 rounded-full`}
                    style={{ width: `${region.percentage * 3.57}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-text-primary">{region.percentage}%</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 rounded-xl border border-border-soft bg-surface-muted/70 p-4">
        <div className="mb-2 text-sm font-medium text-text-primary">Top Growth Markets</div>
        <div className="space-y-2">
          {vendorGeographicData.growthMarkets.map((market) => (
            <div key={market.id} className="flex justify-between text-sm">
              <span className="text-text-secondary">{market.name}</span>
              <span className="font-medium text-success">{market.growth}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardPanel>
  )
}

export default GeographicDistribution
