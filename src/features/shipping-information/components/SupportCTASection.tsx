import { Headphones, Mail, Phone } from "lucide-react"

const SUPPORT_ACTIONS = [
  {
    icon: Headphones,
    label: "Live Chat Support",
    className:
      "bg-pale-lime text-steel-blue px-6 py-4 rounded-xl font-semibold hover:bg-opacity-90 transition-colors text-sm sm:text-base flex items-center justify-center gap-2",
  },
  {
    icon: Phone,
    label: "Call: (855) 334-6825",
    className:
      "bg-white/20 backdrop-blur-sm text-white px-6 py-4 rounded-xl font-semibold hover:bg-white/30 transition-colors text-sm sm:text-base flex items-center justify-center gap-2",
  },
  {
    icon: Mail,
    label: "Email Support",
    className:
      "bg-white/20 backdrop-blur-sm text-white px-6 py-4 rounded-xl font-semibold hover:bg-white/30 transition-colors text-sm sm:text-base flex items-center justify-center gap-2",
  },
] as const

export default function SupportCTASection() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-steel-blue to-blue-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6">
          Need Shipping Assistance?
        </h2>
        <p className="text-lg sm:text-xl text-blue-100 mb-8 sm:mb-12 leading-relaxed">
          Our logistics team is here to help with shipping questions, custom delivery arrangements, and bulk order
          coordination
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {SUPPORT_ACTIONS.map(({ icon: Icon, label, className }) => (
            <button key={label} type="button" className={className}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
