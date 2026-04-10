import { Check, MapPin, Package, Truck } from "lucide-react"

const TRACKING_STEPS = [
  { icon: Check, title: "Order Confirmed", description: "Received & verified", active: true },
  { icon: Package, title: "Shipped", description: "In transit", active: false },
  { icon: Truck, title: "Out for Delivery", description: "Final mile", active: false },
  { icon: MapPin, title: "Delivered", description: "Completed", active: false },
] as const

export default function OrderTrackingStatusBanner() {
  return (
    <div className="mb-8 rounded-2xl border border-border-soft bg-brand-surface p-8 text-inverse-foreground sm:mb-12 sm:rounded-3xl sm:p-12">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-8">
          {TRACKING_STEPS.map(({ icon: Icon, title, description, active }, index) => (
            <div key={title} className="text-center">
              <div
                className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full sm:mb-4 sm:h-20 sm:w-20 ${
                  active ? "bg-accent-strong/90" : "bg-brand/30"
                }`}
              >
                <Icon className={`${active ? "text-brand-strong" : "text-inverse-foreground"} h-5 w-5 sm:h-6 sm:w-6`} />
              </div>
              {index < TRACKING_STEPS.length - 1 ? (
                <div className={`mb-3 hidden h-1 sm:mb-4 sm:block ${active ? "bg-accent-strong/90" : "bg-brand/35"}`} />
              ) : null}
              <h3 className="mb-1 text-sm font-semibold sm:mb-2 sm:text-base">{title}</h3>
              <p className="text-xs text-inverse-muted sm:text-sm">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
