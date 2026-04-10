import type { LucideIcon } from "lucide-react"

interface QuickSupportOptionCardProps {
  title: string
  description: string
  badge: string
  badgeTone: "green" | "gray" | "steel"
  Icon: LucideIcon
}

const badgeColorMap: Record<QuickSupportOptionCardProps["badgeTone"], string> = {
  green: "text-success",
  gray: "text-text-muted",
  steel: "text-brand",
}

const QuickSupportOptionCard = ({ title, description, badge, badgeTone, Icon }: QuickSupportOptionCardProps) => {
  return (
    <div className="group cursor-pointer rounded-[1.5rem] border border-border-soft bg-surface-elevated p-8 text-center transition-shadow hover:shadow-soft">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand text-primary-foreground transition-colors group-hover:bg-brand-strong">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="mb-3 text-xl font-semibold text-text-primary">{title}</h3>
      <p className="mb-4 text-text-secondary">{description}</p>
      <div className={`text-sm font-medium ${badgeColorMap[badgeTone]}`}>{badge}</div>
    </div>
  )
}

export default QuickSupportOptionCard
