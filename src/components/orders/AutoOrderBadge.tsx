import { Repeat } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * Marks an order the scheduler placed from a standing auto order. Shared by the
 * buyer and vendor order tables and their mobile card lists.
 */
export default function AutoOrderBadge({ isBuyerView = true }: { isBuyerView?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="mt-1 inline-flex w-fit cursor-help items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-xs font-semibold text-brand">
          <Repeat className="h-3 w-3" />
          Auto
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        {isBuyerView
          ? "Placed automatically by your auto order schedule."
          : "Placed automatically by the buyer's auto order schedule."}
      </TooltipContent>
    </Tooltip>
  )
}
