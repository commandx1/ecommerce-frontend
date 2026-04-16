import { Camera, RotateCcw } from "lucide-react"

const REPORTING_ITEMS: Array<{ label?: string; icon?: typeof Camera; title: string; description: string }> = [
  {
    label: "24h",
    title: "Reporting Window",
    description: "Report damage within 24 hours of delivery for fastest resolution",
  },
  {
    icon: Camera,
    title: "Documentation Required",
    description: "Photos of packaging and damaged items needed for claim processing",
  },
  {
    icon: RotateCcw,
    title: "Replacement Process",
    description: "Expedited replacement shipment or full refund processed within 48 hours",
  },
]

export default function DamagedGoodsReportingCard() {
  return (
    <div className="rounded-2xl border border-border-soft bg-brand-surface p-8 text-inverse-foreground sm:rounded-3xl sm:p-12">
      <h3 className="mb-6 text-center text-2xl font-bold sm:mb-8 sm:text-3xl text-inverse-muted">
        Damaged Goods Reporting
      </h3>
      <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
        {REPORTING_ITEMS.map((item) => (
          <div key={item.title} className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-strong/90 sm:h-20 sm:w-20">
              {item.label ? (
                <span className="text-xl font-bold text-brand-strong sm:text-2xl">{item.label}</span>
              ) : item.icon ? (
                <item.icon className="h-6 w-6 text-brand-strong sm:h-8 sm:w-8" />
              ) : null}
            </div>
            <h4 className="mb-2 text-base font-semibold sm:text-lg text-inverse-muted">{item.title}</h4>
            <p className="text-xs text-inverse-muted sm:text-sm">{item.description}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <button
          type="button"
          className="rounded-lg bg-accent-strong px-6 py-3 text-sm font-semibold text-brand-strong transition-colors hover:brightness-95 sm:px-8 sm:py-4 sm:text-base"
        >
          Report Damaged Shipment
        </button>
      </div>
    </div>
  )
}
