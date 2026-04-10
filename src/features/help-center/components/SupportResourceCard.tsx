import type { LucideIcon } from "lucide-react"
import Link from "next/link"

interface SupportResourceCardProps {
  title: string
  description: string
  label: string
  Icon: LucideIcon
}

const SupportResourceCard = ({ title, description, label, Icon }: SupportResourceCardProps) => {
  return (
    <div className="group cursor-pointer rounded-[1.4rem] border border-border-soft bg-surface-elevated p-6 transition-shadow hover:shadow-soft">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand text-primary-foreground transition-colors group-hover:bg-brand-strong">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-3 text-lg font-semibold text-text-primary">{title}</h3>
      <p className="mb-4 text-text-secondary">{description}</p>
      <Link href="#" className="font-medium text-brand hover:underline">
        {label}
      </Link>
    </div>
  )
}

export default SupportResourceCard
