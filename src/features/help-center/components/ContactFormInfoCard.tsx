import type { LucideIcon } from "lucide-react"

interface ContactFormInfoCardProps {
  title: string
  details: string
  descriptionLines: string[]
  Icon: LucideIcon
}

const ContactFormInfoCard = ({ title, details, descriptionLines, Icon }: ContactFormInfoCardProps) => {
  return (
    <div className="flex items-start space-x-4">
      <div className="w-12 h-12 bg-steel-blue rounded-lg flex items-center justify-center shrink-0">
        <Icon className="text-white w-5 h-5" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-steel-blue mb-1">{title}</h3>
        <p className="text-gray-600">{details}</p>
        <p className="text-sm text-gray-500">
          {descriptionLines.map((line, index) => (
            <span key={line}>
              {line}
              {index < descriptionLines.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
      </div>
    </div>
  )
}

export default ContactFormInfoCard
