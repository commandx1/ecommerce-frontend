import { cn } from "@/lib/utils"

// Placeholder for initial data loads. The shimmer itself lives in globals.css (.skeleton-shimmer)
// because it needs an ::after pseudo-element; `relative overflow-hidden` here is what clips it.
// Uses --skeleton-base rather than --surface-muted: the latter sits too close to the surfaces it
// renders on, and unlike --glass-tile it is defined outside the dashboard theme scope too.
// Callers that need a different fill (data-table matches --glass-tile) override via className.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("skeleton-shimmer relative overflow-hidden rounded-md bg-skeleton-base", className)}
      {...props}
    />
  )
}

export { Skeleton }
