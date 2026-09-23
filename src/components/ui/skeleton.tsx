import { cn } from "@/lib/utils"

// Pulse placeholder for initial data loads. `bg-surface-muted` (not `--glass-tile`) because
// the glass token only exists under the dashboard theme scope and this renders on /cart too.
export default function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-surface-muted", className)} />
}
