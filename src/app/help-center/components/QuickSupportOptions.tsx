import { MessageCircle, Phone, Mail, Ticket } from "lucide-react"

const options = [
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Chat with our support team in real-time",
    badge: "Available 24/7",
    badgeGreen: true,
  },
  {
    icon: Phone,
    title: "Phone Support",
    description: "Speak directly with our experts",
    badge: "1-800-DENTAL-1",
    badgeGreen: false,
  },
  {
    icon: Mail,
    title: "Email Support",
    description: "Send us your questions via email",
    badge: "support@dentalhub.com",
    badgeGreen: false,
  },
  {
    icon: Ticket,
    title: "Submit Ticket",
    description: "Create a support ticket for detailed help",
    badge: "Response within 2 hours",
    badgeGray: true,
  },
]

export default function QuickSupportOptions() {
  return (
    <section id="quick-support" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-steel-blue mb-4">
            Get Help Fast
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the support option that works best for you
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {options.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="bg-light-mint-gray rounded-2xl p-8 text-center hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <div className="w-16 h-16 bg-steel-blue rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-opacity-90 transition-colors">
                  <Icon className="text-white w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-steel-blue mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 mb-4">{item.description}</p>
                <div
                  className={`text-sm font-medium ${
                    item.badgeGreen
                      ? "text-green-600"
                      : item.badgeGray
                        ? "text-gray-500"
                        : "text-steel-blue"
                  }`}
                >
                  {item.badge}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
