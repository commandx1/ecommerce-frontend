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
    <div className="bg-linear-to-br from-steel-blue to-blue-800 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-white">
      <h3 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center">Damaged Goods Reporting</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {REPORTING_ITEMS.map((item) => (
          <div key={item.title} className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-pale-lime rounded-full flex items-center justify-center mx-auto mb-4">
              {item.label ? (
                <span className="text-steel-blue font-bold text-xl sm:text-2xl">{item.label}</span>
              ) : item.icon ? (
                <item.icon className="text-steel-blue w-6 h-6 sm:w-8 sm:h-8" />
              ) : null}
            </div>
            <h4 className="font-semibold mb-2 text-base sm:text-lg">{item.title}</h4>
            <p className="text-blue-100 text-xs sm:text-sm">{item.description}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <button
          type="button"
          className="bg-pale-lime text-steel-blue px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-opacity-90 transition-colors text-sm sm:text-base"
        >
          Report Damaged Shipment
        </button>
      </div>
    </div>
  )
}
