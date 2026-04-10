import { CheckCircle, Globe, MapPin, Truck, Zap } from "lucide-react"

const TABLE_ROWS = [
  {
    feature: "Best For",
    uber: { label: "Local same-day", icon: MapPin, className: "bg-accent-strong/25 text-brand-strong" },
    shippo: { label: "National & international", icon: Globe, className: "bg-brand/12 text-brand" },
    striped: false,
  },
  {
    feature: "Delivery Speed",
    uber: { primary: "Same day", secondary: "2–4 hours" },
    shippo: { primary: "1–5 business days", secondary: "Carrier dependent" },
    striped: true,
  },
  {
    feature: "Tracking",
    uber: { label: "Real-time courier tracking", icon: CheckCircle },
    shippo: { label: "Carrier-based tracking", icon: CheckCircle },
    striped: false,
  },
  {
    feature: "Bulk Orders",
    uber: { label: "Limited" },
    shippo: { label: "Fully supported", icon: CheckCircle },
    striped: true,
  },
  {
    feature: "Coverage",
    uber: { primary: "Selected cities", secondary: "Major metro areas" },
    shippo: { primary: "Domestic & international", secondary: "Nationwide coverage" },
    striped: false,
  },
  {
    feature: "Ideal Use Case",
    uber: { label: "Urgent local deliveries, emergency supplies" },
    shippo: { label: "Standard orders, bulk shipments, cross-country" },
    striped: true,
  },
] as const

function ShippingCell({
  cell,
}: {
  cell:
    | { label: string; icon?: typeof CheckCircle | typeof Globe | typeof MapPin; className?: string }
    | { primary: string; secondary: string }
}) {
  if ("primary" in cell) {
    return (
      <>
        <div className="text-sm font-semibold text-brand sm:text-base">{cell.primary}</div>
        <div className="mt-1 text-xs text-text-muted sm:text-sm">{cell.secondary}</div>
      </>
    )
  }

  if (cell.icon && cell.className) {
    const Icon = cell.icon
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full font-medium text-xs sm:text-sm ${cell.className}`}
      >
        <Icon className="w-3 h-3 mr-2" />
        {cell.label}
      </span>
    )
  }

  if (cell.icon) {
    const Icon = cell.icon
    return (
      <span className="inline-flex items-center justify-center text-sm sm:text-base">
        <Icon className="mr-2 h-5 w-5 shrink-0 text-success" />
        {cell.label}
      </span>
    )
  }

  return <span className="text-xs text-text-secondary sm:text-sm">{cell.label}</span>
}

export default function ShippingMethodsTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border-soft bg-surface-elevated shadow-panel sm:rounded-3xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-brand-surface text-inverse-foreground">
            <tr>
              <th className="text-left p-4 sm:p-6 font-semibold text-sm sm:text-base">Feature</th>
              <th className="text-center p-4 sm:p-6 font-semibold text-sm sm:text-base">
                <div className="flex flex-col items-center">
                  <Zap className="mb-2 h-6 w-6 text-accent-strong sm:h-8 sm:w-8" />
                  <span>Uber Direct</span>
                </div>
              </th>
              <th className="text-center p-4 sm:p-6 font-semibold text-sm sm:text-base">
                <div className="flex flex-col items-center">
                  <Truck className="mb-2 h-6 w-6 text-accent-strong sm:h-8 sm:w-8" />
                  <span>Shippo</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {TABLE_ROWS.map((row) => (
              <tr
                key={row.feature}
                className={`${row.striped ? "bg-surface-muted/45" : ""} border-b border-border-soft`}
              >
                <td className="p-4 text-sm font-medium text-text-primary sm:p-6 sm:text-base">{row.feature}</td>
                <td className="p-4 sm:p-6 text-center">
                  <ShippingCell cell={row.uber} />
                </td>
                <td className="p-4 sm:p-6 text-center">
                  <ShippingCell cell={row.shippo} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
