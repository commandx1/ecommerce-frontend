import { Button } from "@/components/ui/button"
import vendorMarketingData from "@/data/vendor-marketing.json"
import { cn } from "@/lib/utils"
import DashboardPanel from "./shared/DashboardPanel"
import { DOT_TONE_CLASS_MAP, RING_TONE_CLASS_MAP, STATUS_TONE_CLASS_MAP } from "./shared/dashboardToneMaps"

const campaignToneMap: Record<string, { container: string; status: string; progress: string }> = {
  blue: {
    container: RING_TONE_CLASS_MAP.info,
    status: STATUS_TONE_CLASS_MAP.info,
    progress: DOT_TONE_CLASS_MAP.info,
  },
  green: {
    container: RING_TONE_CLASS_MAP.success,
    status: STATUS_TONE_CLASS_MAP.success,
    progress: DOT_TONE_CLASS_MAP.success,
  },
  yellow: {
    container: RING_TONE_CLASS_MAP.warning,
    status: STATUS_TONE_CLASS_MAP.warning,
    progress: DOT_TONE_CLASS_MAP.warning,
  },
}

const MarketingPerformance = () => {
  return (
    <DashboardPanel
      title="Marketing Performance"
      action={
        <Button type="button" variant="secondary" size="sm" className="rounded-lg px-3">
          Create Campaign
        </Button>
      }
    >
      <div className="space-y-6">
        {vendorMarketingData.campaigns.map((campaign) => {
          const tone = campaignToneMap[campaign.statusColor] || {
            container: RING_TONE_CLASS_MAP.neutral,
            status: STATUS_TONE_CLASS_MAP.neutral,
            progress: DOT_TONE_CLASS_MAP.neutral,
          }

          return (
            <div key={campaign.id} className={cn("rounded-xl border p-4", tone.container)}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-text-primary">{campaign.name}</h3>
                <span className={cn("rounded-full border px-2 py-1 text-xs font-medium", tone.status)}>
                  {campaign.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {campaign.impressions && (
                  <>
                    <div>
                      <div className="text-text-secondary">Impressions</div>
                      <div className="font-semibold text-text-primary">{campaign.impressions}</div>
                    </div>
                    <div>
                      <div className="text-text-secondary">Clicks</div>
                      <div className="font-semibold text-text-primary">{campaign.clicks}</div>
                    </div>
                    <div>
                      <div className="text-text-secondary">CTR</div>
                      <div className="font-semibold text-text-primary">{campaign.ctr}</div>
                    </div>
                  </>
                )}
                {campaign.reach && (
                  <>
                    <div>
                      <div className="text-text-secondary">Reach</div>
                      <div className="font-semibold text-text-primary">{campaign.reach}</div>
                    </div>
                    <div>
                      <div className="text-text-secondary">Conversions</div>
                      <div className="font-semibold text-text-primary">{campaign.conversions}</div>
                    </div>
                    <div>
                      <div className="text-text-secondary">ROAS</div>
                      <div className="font-semibold text-text-primary">{campaign.roas}</div>
                    </div>
                  </>
                )}
                {campaign.subscribers && (
                  <>
                    <div>
                      <div className="text-text-secondary">Subscribers</div>
                      <div className="font-semibold text-text-primary">{campaign.subscribers}</div>
                    </div>
                    <div>
                      <div className="text-text-secondary">Open Rate</div>
                      <div className="font-semibold text-text-primary">{campaign.openRate}</div>
                    </div>
                    <div>
                      <div className="text-text-secondary">Click Rate</div>
                      <div className="font-semibold text-text-primary">{campaign.clickRate}</div>
                    </div>
                  </>
                )}
              </div>
              {campaign.progress !== undefined && (
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">Campaign Progress</span>
                    <span className="font-medium text-text-primary">{campaign.progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-muted">
                    <div
                      className={cn("h-2 rounded-full", tone.progress)}
                      style={{ width: `${campaign.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </DashboardPanel>
  )
}

export default MarketingPerformance
