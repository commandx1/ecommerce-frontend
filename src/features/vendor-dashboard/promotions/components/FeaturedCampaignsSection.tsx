import { cn } from "@/lib/utils"
import type { PromotionCampaign } from "../lib/mock-data"
import type { FeaturedCampaigns } from "../lib/promotion-filters"
import { getCtr, getRoas } from "../lib/promotion-filters"

interface FeaturedCampaignCardProps {
  title: string
  description: string
  campaign?: PromotionCampaign
  accentClassName: string
}

function FeaturedCampaignCard({ title, description, campaign, accentClassName }: FeaturedCampaignCardProps) {
  return (
    <div className={cn("rounded-2xl border p-4 shadow-soft", accentClassName)}>
      <p className="text-xs uppercase tracking-wider text-text-secondary">{title}</p>
      <p className="mt-1 text-xs text-text-secondary">{description}</p>
      {campaign ? (
        <>
          <h3 className="mt-3 font-semibold text-text-primary">{campaign.name}</h3>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div className="glass-tile rounded-lg border border-border-soft p-2">
              <div className="text-xs text-text-secondary">ROAS</div>
              <div className="font-semibold text-text-primary">{getRoas(campaign).toFixed(2)}x</div>
            </div>
            <div className="glass-tile rounded-lg border border-border-soft p-2">
              <div className="text-xs text-text-secondary">CTR</div>
              <div className="font-semibold text-text-primary">{getCtr(campaign).toFixed(2)}%</div>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm text-text-secondary">No matching campaign yet.</p>
      )}
    </div>
  )
}

interface FeaturedCampaignsSectionProps {
  featured: FeaturedCampaigns
}

export default function FeaturedCampaignsSection({ featured }: FeaturedCampaignsSectionProps) {
  return (
    <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <FeaturedCampaignCard
        title="Top Performer"
        description="Highest ROAS among active campaigns"
        campaign={featured.topPerformer}
        accentClassName="border-success/25 bg-success/10"
      />
      <FeaturedCampaignCard
        title="Needs Optimization"
        description="Lowest ROAS with active spend"
        campaign={featured.underperformer}
        accentClassName="border-warning/30 bg-warning/10"
      />
      <FeaturedCampaignCard
        title="Ending Soon"
        description="Campaign approaching end date"
        campaign={featured.endingSoon}
        accentClassName="border-brand/25 bg-brand/10"
      />
    </section>
  )
}
