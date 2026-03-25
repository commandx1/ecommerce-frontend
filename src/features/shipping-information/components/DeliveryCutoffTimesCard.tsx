import { Clock } from "lucide-react"

const CUT_OFF_WINDOWS = [
  {
    title: "Uber Direct Orders",
    value: "2:00 PM Local",
    description: "Orders placed before 2 PM qualify for same-day delivery",
  },
  {
    title: "Standard Shippo Orders",
    value: "4:00 PM EST",
    description: "Next business day dispatch guaranteed",
  },
] as const

export default function DeliveryCutoffTimesCard() {
  return (
    <div className="bg-linear-to-br from-steel-blue to-blue-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white">
      <div className="flex items-center mb-4">
        <Clock className="text-pale-lime w-8 h-8 sm:w-10 sm:h-10 mr-4" />
        <h3 className="text-xl sm:text-2xl font-bold">Same-Day Cut-Off Times</h3>
      </div>
      <div className="space-y-4">
        {CUT_OFF_WINDOWS.map((window) => (
          <div key={window.title} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-sm sm:text-base">{window.title}</span>
              <span className="text-pale-lime font-bold text-base sm:text-lg">{window.value}</span>
            </div>
            <p className="text-blue-100 text-xs sm:text-sm">{window.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
