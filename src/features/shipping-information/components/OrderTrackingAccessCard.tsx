import { Mail, Smartphone, UserCircle } from "lucide-react"

const ACCESS_OPTIONS = [
  { icon: Mail, title: "Email Confirmation", description: "Tracking link sent to your registered email address" },
  { icon: UserCircle, title: "Account Dashboard", description: "View all active shipments in your order history" },
  { icon: Smartphone, title: "SMS Updates", description: "Opt-in for text message tracking notifications" },
] as const

export default function OrderTrackingAccessCard() {
  return (
    <div className="rounded-xl border border-border-soft bg-surface-elevated p-6 shadow-soft sm:rounded-2xl sm:p-8">
      <h3 className="mb-6 text-center text-xl font-bold text-text-primary sm:text-2xl">
        Access Your Tracking Information
      </h3>
      <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
        {ACCESS_OPTIONS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted sm:h-20 sm:w-20">
              <Icon className="h-8 w-8 text-brand sm:h-10 sm:w-10" />
            </div>
            <h4 className="mb-2 text-sm font-semibold text-text-primary sm:text-base">{title}</h4>
            <p className="text-xs text-text-secondary sm:text-sm">{description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
