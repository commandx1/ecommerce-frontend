import { cn } from "@/lib/utils"

export function StatChip({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="rounded-lg border border-border-soft bg-surface px-4 py-2">
      <span className="text-sm text-text-secondary">{label}:</span>
      <span className={cn("ml-2 text-lg font-bold text-text-primary", valueClassName)}>{value}</span>
    </div>
  )
}

export function StatsCard({
  icon,
  iconSurface,
  value,
  label,
  caption,
  captionClassName,
}: {
  icon: React.ReactNode
  iconSurface: string
  value: string
  label: string
  caption: string
  captionClassName: string
}) {
  return (
    <article className="rounded-xl border border-border-soft bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg", iconSurface)}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="mt-1 text-sm text-text-secondary">{label}</p>
      <p className={cn("mt-2 text-xs font-medium", captionClassName)}>{caption}</p>
    </article>
  )
}
