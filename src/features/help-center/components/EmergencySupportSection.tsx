import { AlertTriangle, Mail, MessageCircle, Phone } from "lucide-react"

import PageSectionContainer from "@/components/layout/PageSectionContainer"

import EmergencySupportCard from "./EmergencySupportCard"

const EMERGENCY_CHANNELS = [
  {
    title: "Emergency Hotline",
    value: "1-800-URGENT-1",
    note: "Available 24/7/365",
    icon: Phone,
  },
  {
    title: "Priority Chat",
    value: "Instant Response",
    note: "Skip the queue",
    icon: MessageCircle,
  },
  {
    title: "Priority Email",
    value: "urgent@dentalhub.com",
    note: "15-minute response",
    icon: Mail,
  },
]

export default function EmergencySupportSection() {
  return (
    <PageSectionContainer as="section" className="py-16 bg-coral-orange">
      <div className="text-center text-white">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="text-white w-10 h-10" />
        </div>
        <h2 className="text-4xl font-bold mb-4">Emergency Support</h2>
        <p className="text-xl text-orange-100 mb-8 max-w-3xl mx-auto">
          Need immediate assistance with a critical issue? Our emergency support line is available 24/7 for urgent
          matters that impact patient care.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {EMERGENCY_CHANNELS.map((channel) => (
            <EmergencySupportCard
              key={channel.title}
              title={channel.title}
              value={channel.value}
              note={channel.note}
              Icon={channel.icon}
            />
          ))}
        </div>

        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-2xl mx-auto">
          <p className="text-orange-100 text-sm">
            <strong>Emergency support is reserved for:</strong> Equipment failures affecting patient care, critical
            order issues, payment processing emergencies, and system outages preventing essential operations.
          </p>
        </div>
      </div>
    </PageSectionContainer>
  )
}
