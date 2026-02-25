import {
  Box,
  Shield,
  CheckCircle,
  Camera,
  RotateCcw,
} from "lucide-react"

const packagingItems = [
  {
    title: "Industry-Standard Materials",
    description:
      "Corrugated boxes, bubble wrap, foam inserts, and protective padding",
  },
  {
    title: "Fragile Item Handling",
    description:
      "Special care for delicate dental instruments and equipment",
  },
  {
    title: "Temperature Control",
    description:
      "Cold chain packaging for temperature-sensitive products when required",
  },
  {
    title: "Proper Labeling",
    description:
      "Clear handling instructions and hazard warnings where applicable",
  },
  {
    title: "Sustainability",
    description:
      "Recyclable and eco-friendly packaging materials whenever possible",
  },
]

const insuranceBlocks = [
  {
    title: "Standard Coverage",
    main: "All shipments include basic carrier insurance up to $100 at no additional cost",
    note: "Covers loss or damage during transit",
  },
  {
    title: "Additional Insurance",
    main: "Optional enhanced coverage available for high-value orders during checkout",
    note: "Recommended for equipment and bulk orders over $1,000",
  },
  {
    title: "Signature Requirements",
    main: "Orders over $500 require signature upon delivery for security",
    note: "Ensures proper handoff and proof of delivery",
  },
]

const damagedGoods: Array<{
  label?: string
  icon?: typeof Camera
  title: string
  desc: string
}> = [
  {
    label: "24h",
    title: "Reporting Window",
    desc: "Report damage within 24 hours of delivery for fastest resolution",
  },
  {
    icon: Camera,
    title: "Documentation Required",
    desc: "Photos of packaging and damaged items needed for claim processing",
  },
  {
    icon: RotateCcw,
    title: "Replacement Process",
    desc: "Expedited replacement shipment or full refund processed within 48 hours",
  },
]

export default function PackagingResponsibilitySection() {
  return (
    <section
      id="packaging-responsibility"
      className="py-12 sm:py-16 lg:py-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-steel-blue mb-3 sm:mb-4">
            Packaging & Responsibility
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            Professional handling and clear liability guidelines for your peace
            of mind
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-steel-blue rounded-xl flex items-center justify-center mr-4">
                <Box className="text-white w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-steel-blue">
                Professional Packaging
              </h3>
            </div>
            <div className="space-y-4">
              {packagingItems.map((item) => (
                <div key={item.title} className="flex items-start">
                  <CheckCircle className="text-green-500 w-5 h-5 sm:w-6 sm:h-6 mr-3 mt-1 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">
                      {item.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-coral-orange rounded-xl flex items-center justify-center mr-4">
                <Shield className="text-white w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-steel-blue">
                Insurance & Liability
              </h3>
            </div>
            <div className="space-y-4">
              {insuranceBlocks.map((item) => (
                <div
                  key={item.title}
                  className="bg-light-mint-gray rounded-lg p-4"
                >
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">
                    {item.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">
                    {item.main}
                  </p>
                  <div className="text-xs text-gray-500">{item.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-steel-blue to-blue-800 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-white">
          <h3 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center">
            Damaged Goods Reporting
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {damagedGoods.map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-pale-lime rounded-full flex items-center justify-center mx-auto mb-4">
                  {item.label ? (
                    <span className="text-steel-blue font-bold text-xl sm:text-2xl">
                      {item.label}
                    </span>
                  ) : item.icon ? (
                    (() => {
                      const Icon = item.icon
                      return (
                        <Icon className="text-steel-blue w-6 h-6 sm:w-8 sm:h-8" />
                      )
                    })()
                  ) : null}
                </div>
                <h4 className="font-semibold mb-2 text-base sm:text-lg">
                  {item.title}
                </h4>
                <p className="text-blue-100 text-xs sm:text-sm">{item.desc}</p>
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
      </div>
    </section>
  )
}
