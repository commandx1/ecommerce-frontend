"use client"

import { MessageCircle, Phone } from "lucide-react"

import legalAdditionalData from "@/data/legal-additional.json"

import ContactSupportChannelCard from "./ContactSupportChannelCard"

const SUPPORT_CHANNELS = [
  {
    title: "Phone Support",
    description: "Speak directly with our legal team",
    value: legalAdditionalData.contactInfo.phone,
    icon: Phone,
  },
  {
    title: "Email Support",
    description: "Get detailed responses to complex questions",
    value: legalAdditionalData.contactInfo.email,
    icon: MessageCircle,
  },
]

const ContactSupportInfo = () => {
  return (
    <div className="text-white">
      <h2 className="text-4xl font-bold mb-6">Need Legal Assistance?</h2>
      <p className="text-blue-100 text-lg mb-8 leading-relaxed">
        Our legal and compliance team is available to help you understand our policies, answer questions about
        regulatory requirements, and provide guidance on platform usage.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SUPPORT_CHANNELS.map(({ title, description, value, icon }) => (
          <ContactSupportChannelCard
            key={title}
            title={title}
            description={description}
            value={value}
            Icon={icon}
          />
        ))}
      </div>
    </div>
  )
}

export default ContactSupportInfo
