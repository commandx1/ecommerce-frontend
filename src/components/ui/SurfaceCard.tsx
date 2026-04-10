import { cn } from "@/lib/utils"

interface SurfaceCardProps {
  variant?: "elevated" | "flat" | "subtle" | "editorial" | "technical" | "inline"
  className?: string
  children: React.ReactNode
}

const variantStyles: Record<NonNullable<SurfaceCardProps["variant"]>, string> = {
  elevated: "rounded-[1.75rem] border border-border-soft bg-surface-elevated shadow-panel",
  flat: "rounded-[1.75rem] border border-border-soft bg-surface",
  subtle: "rounded-[1.75rem] border border-border-soft/70 bg-surface-muted/80",
  editorial: "rounded-4xl border border-border-soft bg-surface-elevated shadow-panel",
  technical: "rounded-[1.5rem] border border-border-soft bg-surface shadow-soft",
  inline: "rounded-[1.35rem] border border-border-soft/70 bg-surface-muted/75",
}

export default function SurfaceCard({ variant = "elevated", className, children }: SurfaceCardProps) {
  return <div className={cn(variantStyles[variant], className)}>{children}</div>
}
