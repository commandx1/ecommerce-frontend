import { Mail, MessageCircle, Phone, Ticket } from "lucide-react"

import QuickSupportOptionCard from "./QuickSupportOptionCard"

const options = [
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Chat with our support team in real-time",
    badge: "Available 24/7",
    badgeTone: "green",
  },
  {
    icon: Phone,
    title: "Phone Support",
    description: "Speak directly with our experts",
    badge: "1-800-DENTAL-1",
    badgeTone: "steel",
  },
  {
    icon: Mail,
    title: "Email Support",
    description: "Send us your questions via email",
    badge: "support@dentalhub.com",
    badgeTone: "steel",
  },
  {
    icon: Ticket,
    title: "Submit Ticket",
    description: "Create a support ticket for detailed help",
    badge: "Response within 2 hours",
    badgeTone: "gray",
  },
] as const

export default function QuickSupportOptions() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-steel-blue mb-4">Get Help Fast</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Choose the support option that works best for you</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {options.map((item) => (
            <QuickSupportOptionCard
              key={item.title}
              title={item.title}
              description={item.description}
              badge={item.badge}
              badgeTone={item.badgeTone}
              Icon={item.icon}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
