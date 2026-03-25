import { Mail, MessageCircle, Phone } from "lucide-react"

import ContactFormInfoCard from "@/features/help-center/components/ContactFormInfoCard"

const CONTACT_INFO_ITEMS = [
  {
    title: "Phone Support",
    details: "1-800-DENTAL-1 (1-800-336-8251)",
    descriptionLines: ["Monday - Friday: 6 AM - 8 PM EST", "Saturday - Sunday: 8 AM - 5 PM EST"],
    icon: Phone,
  },
  {
    title: "Email Support",
    details: "support@dentalhub.com",
    descriptionLines: ["Response within 2 hours during business hours"],
    icon: Mail,
  },
  {
    title: "Live Chat",
    details: "Available 24/7 on our website",
    descriptionLines: ["Instant responses from our support team"],
    icon: MessageCircle,
  },
]

const ContactFormInfo = () => {
  return (
    <div>
      <h2 className="text-4xl font-bold text-steel-blue mb-6">Get in Touch</h2>
      <p className="text-xl text-gray-600 mb-8">
        Can&apos;t find what you&apos;re looking for? Our support team is here to help. Send us a message and we&apos;ll
        get back to you within 2 hours during business hours.
      </p>
      <div className="space-y-6">
        {CONTACT_INFO_ITEMS.map((item) => (
          <ContactFormInfoCard
            key={item.title}
            title={item.title}
            details={item.details}
            descriptionLines={item.descriptionLines}
            Icon={item.icon}
          />
        ))}
      </div>
    </div>
  )
}

export default ContactFormInfo
