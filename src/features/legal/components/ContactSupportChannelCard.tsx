import type { LucideIcon } from "lucide-react"

interface ContactSupportChannelCardProps {
  title: string
  description: string
  value: string
  Icon: LucideIcon
}

const ContactSupportChannelCard = ({ title, description, value, Icon }: ContactSupportChannelCardProps) => {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
      <div className="w-12 h-12 bg-pale-lime rounded-lg flex items-center justify-center mb-4">
        <Icon className="text-steel-blue w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-blue-100 text-sm mb-3">{description}</p>
      <p className="text-pale-lime font-semibold">{value}</p>
    </div>
  )
}

export default ContactSupportChannelCard
