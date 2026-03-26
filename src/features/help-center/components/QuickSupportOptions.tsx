import { Mail, MessageCircle, Phone, Ticket } from "lucide-react"

import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SectionHeading from "@/components/layout/SectionHeading"

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
    <PageSectionContainer as="section" className="py-16 bg-white">
      <SectionHeading
        title="Get Help Fast"
        description="Choose the support option that works best for you"
        className="mb-12 justify-center"
        titleClassName="text-4xl text-center mb-4"
        descriptionClassName="text-xl max-w-3xl mx-auto text-center"
      />
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
    </PageSectionContainer>
  )
}
