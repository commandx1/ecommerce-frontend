import { ShieldCheck } from "lucide-react"

export default function HeroBadge() {
  return (
    <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-xl">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-pale-lime rounded-lg flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-steel-blue" />
        </div>
        <div>
          <div className="font-semibold text-steel-blue">Verified Suppliers</div>
          <div className="text-sm text-gray-600">Licensed &amp; Certified</div>
        </div>
      </div>
    </div>
  )
}
