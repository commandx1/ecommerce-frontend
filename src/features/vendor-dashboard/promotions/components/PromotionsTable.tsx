import { Copy, PauseCircle, Pencil, PlayCircle, Trash2 } from "lucide-react"
import { STATUS_TONE_CLASS_MAP } from "@/components/dashboard-shared/dashboardToneMaps"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { cn } from "@/lib/utils"
import type { CampaignStatus, PromotionCampaign } from "../lib/mock-data"
import { getCtr, getRoas } from "../lib/promotion-filters"

const statusToneMap: Record<CampaignStatus, string> = {
  Active: STATUS_TONE_CLASS_MAP.success,
  Paused: STATUS_TONE_CLASS_MAP.warning,
  Draft: STATUS_TONE_CLASS_MAP.neutral,
  Completed: STATUS_TONE_CLASS_MAP.info,
  Archived: STATUS_TONE_CLASS_MAP.danger,
}

interface ActionIconButtonProps {
  onClick: () => void
  icon: React.ReactNode
  label: string
  tone?: "default" | "danger"
}

function ActionIconButton({ onClick, icon, label, tone = "default" }: ActionIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-2 py-1.5 text-text-secondary transition-colors hover:text-text-primary",
        tone === "danger"
          ? "border-danger/30 hover:bg-danger/10 hover:text-danger"
          : "border-border-soft hover:bg-surface-muted",
      )}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  )
}

interface PromotionsTableProps {
  campaigns: PromotionCampaign[]
  onEdit: (campaign: PromotionCampaign) => void
  onDuplicate: (campaign: PromotionCampaign) => void
  onTogglePauseResume: (campaign: PromotionCampaign) => void
  onArchive: (campaign: PromotionCampaign) => void
}

/**
 * Raw markup, not `ui/data-table`: DataTable hardcodes its header row styling, and this table's
 * tinted header would need a DataTable change affecting every other caller.
 */
export default function PromotionsTable({
  campaigns,
  onEdit,
  onDuplicate,
  onTogglePauseResume,
  onArchive,
}: PromotionsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-287.5">
        <thead className="border-y border-border-soft bg-surface-muted/70">
          <tr>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Campaign
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Status
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Channel
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Budget
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Spend
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Revenue
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
              ROAS
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
              CTR
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Start / End
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign) => (
            <tr key={campaign.id} className="border-b border-border-soft/80">
              <td className="px-4 py-3 text-center">
                <div className="font-medium text-text-primary">{campaign.name}</div>
                <div className="text-xs text-text-secondary">{campaign.objective}</div>
              </td>
              <td className="px-4 py-3 text-center">
                <span
                  className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs", statusToneMap[campaign.status])}
                >
                  {campaign.status}
                </span>
              </td>
              <td className="px-4 py-3 text-center text-text-secondary">{campaign.channel}</td>
              <td className="px-4 py-3 text-center text-text-primary">{formatCurrency(campaign.budget)}</td>
              <td className="px-4 py-3 text-center text-text-primary">{formatCurrency(campaign.spend)}</td>
              <td className="px-4 py-3 text-center font-semibold text-text-primary">
                {formatCurrency(campaign.revenue)}
              </td>
              <td className="px-4 py-3 text-center text-text-primary">{getRoas(campaign).toFixed(2)}x</td>
              <td className="px-4 py-3 text-center text-text-primary">{getCtr(campaign).toFixed(2)}%</td>
              <td className="px-4 py-3 text-center text-sm text-text-secondary">
                {campaign.startDate} → {campaign.endDate}
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <ActionIconButton
                    onClick={() => onEdit(campaign)}
                    icon={<Pencil className="h-4 w-4" />}
                    label="Edit"
                  />
                  <ActionIconButton
                    onClick={() => onDuplicate(campaign)}
                    icon={<Copy className="h-4 w-4" />}
                    label="Duplicate"
                  />
                  {(campaign.status === "Active" || campaign.status === "Paused") && (
                    <ActionIconButton
                      onClick={() => onTogglePauseResume(campaign)}
                      icon={
                        campaign.status === "Active" ? (
                          <PauseCircle className="h-4 w-4" />
                        ) : (
                          <PlayCircle className="h-4 w-4" />
                        )
                      }
                      label={campaign.status === "Active" ? "Pause" : "Resume"}
                    />
                  )}
                  {campaign.status !== "Archived" && (
                    <ActionIconButton
                      onClick={() => onArchive(campaign)}
                      icon={<Trash2 className="h-4 w-4" />}
                      label="Archive"
                      tone="danger"
                    />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
