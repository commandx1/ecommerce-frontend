import type { LucideIcon } from "lucide-react"

interface EmergencySupportCardProps {
  title: string
  value: string
  note: string
  Icon: LucideIcon
}

const EmergencySupportCard = ({ title, value, note, Icon }: EmergencySupportCardProps) => {
  return (
    <div className="rounded-[1.35rem] border border-white/12 bg-white/8 p-6 backdrop-blur-sm">
      <Icon className="mb-3 h-8 w-8 text-inverse-foreground" />
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-lg font-medium text-inverse-foreground">{value}</p>
      <p className="mt-1 text-sm text-inverse-muted">{note}</p>
    </div>
  )
}

export default EmergencySupportCard
