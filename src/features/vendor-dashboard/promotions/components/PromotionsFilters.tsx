import { Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CampaignChannel, CampaignStatus } from "../lib/mock-data"
import { type CampaignSortDir, type CampaignSortKey, CHANNEL_OPTIONS, STATUS_OPTIONS } from "../lib/promotion-filters"

interface PromotionsFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: CampaignStatus | "All"
  onStatusFilterChange: (value: CampaignStatus | "All") => void
  channelFilter: CampaignChannel | "All"
  onChannelFilterChange: (value: CampaignChannel | "All") => void
  sortBy: CampaignSortKey
  onSortByChange: (value: CampaignSortKey) => void
  sortDir: CampaignSortDir
  onSortDirChange: (value: CampaignSortDir) => void
}

export default function PromotionsFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  channelFilter,
  onChannelFilterChange,
  sortBy,
  onSortByChange,
  sortDir,
  onSortDirChange,
}: PromotionsFiltersProps) {
  return (
    <div className="mb-4 grid grid-cols-1 gap-3 xl:grid-cols-5">
      <div className="xl:col-span-2">
        <div className="flex h-11 items-center gap-2 rounded-2xl border border-border-soft bg-surface-elevated px-3 shadow-soft">
          <Search className="h-4 w-4 text-text-muted" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search campaign or objective"
            className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
        </div>
      </div>
      <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as CampaignStatus | "All")}>
        <SelectTrigger
          aria-label="Status"
          className="h-11 w-full rounded-2xl border border-border-soft bg-surface-elevated shadow-soft"
        >
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={channelFilter} onValueChange={(value) => onChannelFilterChange(value as CampaignChannel | "All")}>
        <SelectTrigger
          aria-label="Channel"
          className="h-11 w-full rounded-2xl border border-border-soft bg-surface-elevated shadow-soft"
        >
          <SelectValue placeholder="Channel" />
        </SelectTrigger>
        <SelectContent>
          {CHANNEL_OPTIONS.map((channel) => (
            <SelectItem key={channel} value={channel}>
              {channel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="grid grid-cols-2 gap-2">
        <Select value={sortBy} onValueChange={(value) => onSortByChange(value as CampaignSortKey)}>
          <SelectTrigger
            aria-label="Sort By"
            className="h-11 w-full rounded-2xl border border-border-soft bg-surface-elevated shadow-soft"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="revenue">Revenue</SelectItem>
            <SelectItem value="spend">Spend</SelectItem>
            <SelectItem value="roas">ROAS</SelectItem>
            <SelectItem value="ctr">CTR</SelectItem>
            <SelectItem value="endDate">End Date</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortDir} onValueChange={(value) => onSortDirChange(value as CampaignSortDir)}>
          <SelectTrigger
            aria-label="Sort Direction"
            className="h-11 w-full rounded-2xl border border-border-soft bg-surface-elevated shadow-soft"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Desc</SelectItem>
            <SelectItem value="asc">Asc</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
