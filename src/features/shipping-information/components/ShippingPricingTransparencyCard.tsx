import { CheckCircle } from "lucide-react"

const TRANSPARENCY_ITEMS = [
  "Exact shipping cost displayed before checkout completion",
  "Multiple carrier options with rate comparison",
  "No hidden fees or surprise charges",
  "Volume discounts automatically applied for bulk orders",
] as const

export default function ShippingPricingTransparencyCard() {
  return (
    <div className="rounded-xl border border-accent-strong/25 bg-accent-strong/12 p-6 sm:rounded-2xl sm:p-8">
      <h3 className="mb-4 text-xl font-bold text-brand-strong sm:text-2xl">Pricing Transparency</h3>
      <div className="space-y-4">
        {TRANSPARENCY_ITEMS.map((item) => (
          <div key={item} className="flex items-start">
            <CheckCircle className="mr-3 mt-1 h-5 w-5 shrink-0 text-brand sm:h-6 sm:w-6" />
            <p className="text-sm text-text-primary sm:text-base">{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
