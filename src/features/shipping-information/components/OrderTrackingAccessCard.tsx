import { Mail, Smartphone, UserCircle } from "lucide-react"

const ACCESS_OPTIONS = [
  { icon: Mail, title: "Email Confirmation", description: "Tracking link sent to your registered email address" },
  { icon: UserCircle, title: "Account Dashboard", description: "View all active shipments in your order history" },
  { icon: Smartphone, title: "SMS Updates", description: "Opt-in for text message tracking notifications" },
] as const

export default function OrderTrackingAccessCard() {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8">
      <h3 className="text-xl sm:text-2xl font-bold text-steel-blue mb-6 text-center">
        Access Your Tracking Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {ACCESS_OPTIONS.map(({ icon: Icon, title, description }) => (
          <div key={title} className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon className="text-steel-blue w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">{title}</h4>
            <p className="text-xs sm:text-sm text-gray-600">{description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
