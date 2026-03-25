import { Info } from "lucide-react"

const TIPS = [
  "Include screenshots or photos when relevant",
  "Provide your order number for order-related issues",
  "Be specific about error messages or unexpected behavior",
  "Mention your browser/device if experiencing website issues",
]

const TicketTipsCard = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <Info className="text-blue-500 mt-0.5 w-5 h-5 shrink-0" />
        <div>
          <h4 className="font-semibold text-blue-900 mb-1">Tips for faster resolution:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            {TIPS.map((tip) => (
              <li key={tip}>• {tip}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default TicketTipsCard
