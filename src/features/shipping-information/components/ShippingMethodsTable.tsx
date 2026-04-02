import { CheckCircle, Globe, MapPin, Truck, Zap } from "lucide-react"

const TABLE_ROWS = [
  {
    feature: "Best For",
    uber: { label: "Local same-day", icon: MapPin, className: "bg-pale-lime/20 text-steel-blue" },
    shippo: { label: "National & international", icon: Globe, className: "bg-blue-100 text-steel-blue" },
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
        <div className="text-steel-blue font-semibold text-sm sm:text-base">{cell.primary}</div>
        <div className="text-gray-500 text-xs sm:text-sm mt-1">{cell.secondary}</div>
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
        <Icon className="text-green-500 w-5 h-5 mr-2 shrink-0" />
        {cell.label}
      </span>
    )
  }

  return <span className="text-xs sm:text-sm text-gray-600">{cell.label}</span>
}

export default function ShippingMethodsTable() {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-steel-blue text-white">
            <tr>
              <th className="text-left p-4 sm:p-6 font-semibold text-sm sm:text-base">Feature</th>
              <th className="text-center p-4 sm:p-6 font-semibold text-sm sm:text-base">
                <div className="flex flex-col items-center">
                  <Zap className="text-pale-lime w-6 h-6 sm:w-8 sm:h-8 mb-2" />
                  <span>Uber Direct</span>
                </div>
              </th>
              <th className="text-center p-4 sm:p-6 font-semibold text-sm sm:text-base">
                <div className="flex flex-col items-center">
                  <Truck className="text-pale-lime w-6 h-6 sm:w-8 sm:h-8 mb-2" />
                  <span>Shippo</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {TABLE_ROWS.map((row) => (
              <tr
                key={row.feature}
                className={`${row.striped ? "bg-gray-50/30" : ""} border-b border-gray-100`}
              >
                <td className="p-4 sm:p-6 font-medium text-gray-700 text-sm sm:text-base">{row.feature}</td>
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
