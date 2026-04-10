import {
  Barcode,
  Bell,
  Clock,
  LayoutDashboard,
  Link as LinkIcon,
  Smartphone,
  TrendingUp,
  Truck,
  User,
  Zap,
} from "lucide-react"

const UBER_TRACKING_FEATURES = [
  {
    icon: Smartphone,
    title: "Live Courier Tracking",
    description: "Real-time GPS location of your delivery courier on an interactive map",
  },
  {
    icon: Clock,
    title: "Dynamic ETA Updates",
    description: "Continuously updated estimated arrival time based on current location",
  },
  { icon: Bell, title: "SMS Notifications", description: "Text alerts for pickup, en route, and delivery completion" },
  {
    icon: User,
    title: "Courier Contact",
    description: "Direct communication option with your assigned delivery courier",
  },
] as const

const SHIPPO_TRACKING_FEATURES = [
  {
    icon: Barcode,
    title: "Tracking Number Provided",
    description: "Unique tracking ID sent via email immediately upon shipment",
  },
  {
    icon: LinkIcon,
    title: "Carrier Tracking Portal",
    description: "Direct link to UPS, FedEx, USPS, or DHL tracking system",
  },
  {
    icon: TrendingUp,
    title: "Milestone Updates",
    description: "Email notifications at key checkpoints throughout delivery journey",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard Integration",
    description: "View all shipment statuses in your account dashboard",
  },
] as const

function TrackingProviderCard({
  title,
  icon,
  features,
  wrapperClass,
  iconWrapperClass,
  iconClass,
}: {
  title: string
  icon: "uber" | "shippo"
  features: readonly { icon: typeof Smartphone; title: string; description: string }[]
  wrapperClass: string
  iconWrapperClass: string
  iconClass: string
}) {
  const HeaderIcon = icon === "uber" ? Zap : Truck

  return (
    <div className={wrapperClass}>
      <div className="flex items-center mb-6">
        <div
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mr-4 ${iconWrapperClass}`}
        >
          <HeaderIcon className={`w-6 h-6 sm:w-8 sm:h-8 ${iconClass}`} />
        </div>
        <h3 className="text-xl font-bold text-text-primary sm:text-2xl">{title}</h3>
      </div>
      <div className="space-y-4">
        {features.map(({ icon: Icon, title: featureTitle, description }) => (
          <div key={featureTitle} className="flex items-start">
            <Icon className="mr-3 mt-1 h-5 w-5 shrink-0 text-brand sm:h-6 sm:w-6" />
            <div>
              <h4 className="mb-1 text-sm font-semibold text-text-primary sm:text-base">{featureTitle}</h4>
              <p className="text-xs text-text-secondary sm:text-sm">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function OrderTrackingProviderCards() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
      <TrackingProviderCard
        title="Uber Direct Tracking"
        icon="uber"
        features={UBER_TRACKING_FEATURES}
        wrapperClass="rounded-xl border border-border-soft bg-surface-muted/55 p-6 sm:rounded-2xl sm:p-8"
        iconWrapperClass="bg-accent-strong/25"
        iconClass="text-brand-strong"
      />
      <TrackingProviderCard
        title="Shippo Tracking"
        icon="shippo"
        features={SHIPPO_TRACKING_FEATURES}
        wrapperClass="rounded-xl border border-border-soft bg-surface-elevated p-6 shadow-soft sm:rounded-2xl sm:p-8"
        iconWrapperClass="bg-brand-surface"
        iconClass="text-inverse-foreground"
      />
    </div>
  )
}
