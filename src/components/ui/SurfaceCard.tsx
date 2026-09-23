import { cn } from "@/lib/utils"

type SurfaceCardTag = "div" | "section" | "article" | "li" | "form"

interface SurfaceCardProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "elevated" | "flat" | "subtle" | "editorial" | "technical" | "inline" | "glass"
  as?: SurfaceCardTag
  ref?: React.Ref<HTMLElement>
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
  glass: "glass-panel",
}

export default function SurfaceCard({
  variant = "elevated",
  as = "div",
  className,
  children,
  ...rest
}: SurfaceCardProps) {
  const Tag = as as React.ElementType
  return (
    <Tag className={cn(variantStyles[variant], className)} {...rest}>
      {children}
    </Tag>
  )
}
