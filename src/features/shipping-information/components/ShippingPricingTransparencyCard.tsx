import { CheckCircle } from "lucide-react"

const TRANSPARENCY_ITEMS = [
  "Exact shipping cost displayed before checkout completion",
  "Multiple carrier options with rate comparison",
  "No hidden fees or surprise charges",
  "Volume discounts automatically applied for bulk orders",
] as const

export default function ShippingPricingTransparencyCard() {
  return (
    <div className="bg-gradient-to-br from-pale-lime to-lime-200 rounded-xl sm:rounded-2xl p-6 sm:p-8">
      <h3 className="text-xl sm:text-2xl font-bold text-steel-blue mb-4">Pricing Transparency</h3>
      <div className="space-y-4">
        {TRANSPARENCY_ITEMS.map((item) => (
          <div key={item} className="flex items-start">
            <CheckCircle className="text-steel-blue w-5 h-5 sm:w-6 sm:h-6 mr-3 mt-1 shrink-0" />
            <p className="text-sm sm:text-base text-gray-800">{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
