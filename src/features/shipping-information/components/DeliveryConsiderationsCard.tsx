import { Circle } from "lucide-react"
import NoticeBanner from "@/components/feedback/NoticeBanner"

const CONSIDERATIONS = [
  "Weekend and holiday orders process next business day",
  "International shipments may experience customs delays",
  "Weather conditions may affect delivery timelines",
  "Bulk orders may require additional processing time",
] as const

export default function DeliveryConsiderationsCard() {
  return (
    <NoticeBanner tone="warning" title="Important Considerations" className="p-6 sm:rounded-2xl sm:p-8">
      <ul className="mt-3 space-y-2 text-sm text-yellow-800 sm:text-base">
        {CONSIDERATIONS.map((item) => (
          <li key={item} className="flex items-start">
            <Circle className="mr-2 mt-2 h-2 w-2 shrink-0 fill-current text-yellow-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </NoticeBanner>
  )
}
