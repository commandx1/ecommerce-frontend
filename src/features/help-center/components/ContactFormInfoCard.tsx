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
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="mb-1 text-lg font-semibold text-text-primary">{title}</h3>
        <p className="text-text-secondary">{details}</p>
        <p className="text-sm text-text-muted">
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
