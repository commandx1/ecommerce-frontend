import DashboardPanel from "@/app/vendor-dashboard/components/shared/DashboardPanel"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { cn } from "@/lib/utils"
import type { CampaignChannel } from "../lib/mock-data"
import type { ChannelMixItem } from "../lib/promotion-filters"

const channelColorMap: Record<CampaignChannel, string> = {
  Email: "bg-brand",
  "Paid Search": "bg-success",
  Social: "bg-warning",
  Marketplace: "bg-brand-strong",
  "On-site": "bg-text-muted",
}

interface ChannelMixPanelProps {
  channelMix: ChannelMixItem[]
}

export default function ChannelMixPanel({ channelMix }: ChannelMixPanelProps) {
  return (
    <DashboardPanel title="Channel Mix" description="Revenue contribution by marketing channel">
      <div className="space-y-4">
        {channelMix.map((item) => (
          <div key={item.channel}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-text-primary">{item.channel}</span>
              <span className="text-text-secondary">{formatCurrency(item.revenue)}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-muted">
              <div
                className={cn("h-2 rounded-full", channelColorMap[item.channel])}
                style={{ width: `${item.share}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </DashboardPanel>
  )
}
