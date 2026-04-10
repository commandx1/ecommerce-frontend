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
    <PageSectionContainer as="section" className="bg-brand-surface py-16">
      <div className="text-center text-inverse-foreground">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/14">
          <AlertTriangle className="h-10 w-10 text-inverse-foreground" />
        </div>
        <h2 className="mb-4 text-4xl font-bold">Emergency Support</h2>
        <p className="mx-auto mb-8 max-w-3xl text-xl text-inverse-muted">
          Need immediate assistance with a critical issue? Our emergency support line is available 24/7 for urgent
          matters that impact patient care.
        </p>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
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

        <div className="mx-auto mt-8 max-w-2xl rounded-[1.35rem] border border-white/12 bg-white/8 p-6 backdrop-blur-sm">
          <p className="text-sm text-inverse-muted">
            <strong>Emergency support is reserved for:</strong> Equipment failures affecting patient care, critical
            order issues, payment processing emergencies, and system outages preventing essential operations.
          </p>
        </div>
      </div>
    </PageSectionContainer>
  )
}
