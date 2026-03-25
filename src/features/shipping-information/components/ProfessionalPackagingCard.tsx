import { Box, CheckCircle } from "lucide-react"

const PACKAGING_ITEMS = [
  {
    title: "Industry-Standard Materials",
    description: "Corrugated boxes, bubble wrap, foam inserts, and protective padding",
  },
  { title: "Fragile Item Handling", description: "Special care for delicate dental instruments and equipment" },
  {
    title: "Temperature Control",
    description: "Cold chain packaging for temperature-sensitive products when required",
  },
  { title: "Proper Labeling", description: "Clear handling instructions and hazard warnings where applicable" },
  { title: "Sustainability", description: "Recyclable and eco-friendly packaging materials whenever possible" },
] as const

export default function ProfessionalPackagingCard() {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-steel-blue rounded-xl flex items-center justify-center mr-4">
          <Box className="text-white w-6 h-6 sm:w-8 sm:h-8" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-steel-blue">Professional Packaging</h3>
      </div>
      <div className="space-y-4">
        {PACKAGING_ITEMS.map((item) => (
          <div key={item.title} className="flex items-start">
            <CheckCircle className="text-green-500 w-5 h-5 sm:w-6 sm:h-6 mr-3 mt-1 shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">{item.title}</h4>
              <p className="text-xs sm:text-sm text-gray-600">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
