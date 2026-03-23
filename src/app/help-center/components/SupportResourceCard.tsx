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
    <div className="bg-light-mint-gray rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer group">
      <div className="w-14 h-14 bg-steel-blue rounded-xl flex items-center justify-center mb-4 group-hover:bg-opacity-90 transition-colors">
        <Icon className="text-white w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-steel-blue mb-3">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <Link href="#" className="text-steel-blue font-medium hover:underline">
        {label}
      </Link>
    </div>
  )
}

export default SupportResourceCard
