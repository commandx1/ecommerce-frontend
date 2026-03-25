import { AlertTriangle, Circle } from "lucide-react"

const CONSIDERATIONS = [
  "Weekend and holiday orders process next business day",
  "International shipments may experience customs delays",
  "Weather conditions may affect delivery timelines",
  "Bulk orders may require additional processing time",
] as const

export default function DeliveryConsiderationsCard() {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl sm:rounded-2xl p-6 sm:p-8">
      <div className="flex items-start">
        <AlertTriangle className="text-yellow-600 w-6 h-6 sm:w-8 sm:h-8 mr-4 mt-1 shrink-0" />
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-yellow-900 mb-3">Important Considerations</h3>
          <ul className="space-y-2 text-sm sm:text-base text-yellow-800">
            {CONSIDERATIONS.map((item) => (
              <li key={item} className="flex items-start">
                <Circle className="text-yellow-600 w-2 h-2 mr-2 mt-2 shrink-0 fill-current" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
