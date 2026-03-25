import { Info } from "lucide-react"

export default function FreeShippingNote() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
      <div className="flex items-start">
        <Info className="text-steel-blue w-5 h-5 sm:w-6 sm:h-6 mr-3 mt-1 shrink-0" />
        <div>
          <h4 className="font-semibold text-steel-blue mb-2 text-sm sm:text-base">Free Shipping Threshold</h4>
          <p className="text-xs sm:text-sm text-gray-700">
            Standard shipping is free on orders over $500 within the continental U.S.
          </p>
        </div>
      </div>
    </div>
  )
}
