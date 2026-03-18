import {
  Barcode,
  Bell,
  Check,
  Clock,
  LayoutDashboard,
  Link as LinkIcon,
  Mail,
  MapPin,
  Smartphone as MobileIcon,
  Package,
  Smartphone,
  TrendingUp,
  Truck,
  User,
  UserCircle,
  Zap,
} from "lucide-react"

const trackingSteps = [
  { icon: Check, title: "Order Confirmed", desc: "Received & verified", active: true },
  { icon: Package, title: "Shipped", desc: "In transit", active: false },
  { icon: Truck, title: "Out for Delivery", desc: "Final mile", active: false },
  { icon: MapPin, title: "Delivered", desc: "Completed", active: false },
]

const uberTracking = [
  {
    icon: Smartphone,
    title: "Live Courier Tracking",
    desc: "Real-time GPS location of your delivery courier on an interactive map",
  },
  {
    icon: Clock,
    title: "Dynamic ETA Updates",
    desc: "Continuously updated estimated arrival time based on current location",
  },
  { icon: Bell, title: "SMS Notifications", desc: "Text alerts for pickup, en route, and delivery completion" },
  { icon: User, title: "Courier Contact", desc: "Direct communication option with your assigned delivery courier" },
]

const shippoTracking = [
  {
    icon: Barcode,
    title: "Tracking Number Provided",
    desc: "Unique tracking ID sent via email immediately upon shipment",
  },
  { icon: LinkIcon, title: "Carrier Tracking Portal", desc: "Direct link to UPS, FedEx, USPS, or DHL tracking system" },
  {
    icon: TrendingUp,
    title: "Milestone Updates",
    desc: "Email notifications at key checkpoints throughout delivery journey",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard Integration",
    desc: "View all shipment statuses in your account dashboard",
  },
]

const accessOptions = [
  { icon: Mail, title: "Email Confirmation", desc: "Tracking link sent to your registered email address" },
  { icon: UserCircle, title: "Account Dashboard", desc: "View all active shipments in your order history" },
  { icon: MobileIcon, title: "SMS Updates", desc: "Opt-in for text message tracking notifications" },
]

export default function OrderTrackingSection() {
  return (
    <section id="order-tracking" className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-steel-blue mb-3 sm:mb-4">Order Tracking</h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            Monitor your shipment from fulfillment to delivery with real-time updates
          </p>
        </div>

        <div className="bg-gradient-to-br from-steel-blue to-blue-800 rounded-2xl sm:rounded-3xl p-8 sm:p-12 mb-8 sm:mb-12">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
              {trackingSteps.map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={s.title} className="text-center">
                    <div
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 ${s.active ? "bg-pale-lime" : "bg-white/20"}`}
                    >
                      <Icon className={`${s.active ? "text-steel-blue" : "text-white"} w-5 h-5 sm:w-6 sm:h-6`} />
                    </div>
                    {i < trackingSteps.length - 1 && (
                      <div
                        className={`h-1 mb-3 sm:mb-4 hidden sm:block ${s.active ? "bg-pale-lime" : "bg-white/30"}`}
                      />
                    )}
                    <h3 className="text-white font-semibold mb-1 sm:mb-2 text-sm sm:text-base">{s.title}</h3>
                    <p className="text-blue-100 text-xs sm:text-sm">{s.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
          <div className="bg-light-mint-gray rounded-xl sm:rounded-2xl p-6 sm:p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-pale-lime rounded-xl flex items-center justify-center mr-4">
                <Zap className="text-steel-blue w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-steel-blue">Uber Direct Tracking</h3>
            </div>
            <div className="space-y-4">
              {uberTracking.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="flex items-start">
                    <Icon className="text-steel-blue w-5 h-5 sm:w-6 sm:h-6 mr-3 mt-1 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">{item.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-steel-blue rounded-xl flex items-center justify-center mr-4">
                <Truck className="text-white w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-steel-blue">Shippo Tracking</h3>
            </div>
            <div className="space-y-4">
              {shippoTracking.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="flex items-start">
                    <Icon className="text-steel-blue w-5 h-5 sm:w-6 sm:h-6 mr-3 mt-1 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">{item.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8">
          <h3 className="text-xl sm:text-2xl font-bold text-steel-blue mb-6 text-center">
            Access Your Tracking Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {accessOptions.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-light-mint-gray rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="text-steel-blue w-8 h-8 sm:w-10 sm:h-10" />
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">{item.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-600">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
