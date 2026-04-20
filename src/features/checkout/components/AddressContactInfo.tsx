import { MapPin, Phone } from "lucide-react"
import { formatPhoneNumber } from "@/lib/utils/phone-number"

interface AddressContactInfoProps {
  address: string
  phone?: string
  title?: string
  className?: string
}

export default function AddressContactInfo({ address, phone, title, className }: AddressContactInfoProps) {
  const displayPhone = phone ? formatPhoneNumber(phone) : "-"

  return (
    <div className={className}>
      {title ? <h3 className="mb-1 font-bold text-text-primary">{title}</h3> : null}
      <div className="mt-3 space-y-2.5">
        <div className="flex items-start gap-2 text-sm text-text-primary">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
          <p className="leading-relaxed">{address}</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
          <Phone className="h-4 w-4 shrink-0 text-text-muted" />
          <p>{displayPhone}</p>
        </div>
      </div>
    </div>
  )
}
