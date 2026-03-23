import type { LucideIcon } from "lucide-react"

interface EmergencySupportCardProps {
  title: string
  value: string
  note: string
  Icon: LucideIcon
}

const EmergencySupportCard = ({ title, value, note, Icon }: EmergencySupportCardProps) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
      <Icon className="text-white w-8 h-8 mb-3" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-orange-100 text-lg font-medium">{value}</p>
      <p className="text-orange-200 text-sm mt-1">{note}</p>
    </div>
  )
}

export default EmergencySupportCard
