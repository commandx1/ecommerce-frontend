"use client"

import { ChevronDown } from "lucide-react"
import { useState } from "react"

const faqItems = [
  {
    id: "sf1",
    question:
      "Can I schedule a specific delivery date or time?",
    answer:
      "Uber Direct offers same-day delivery within a specific time window based on order placement time. For Shippo shipments, you can request preferred delivery dates during checkout, though final delivery timing depends on carrier schedules. For guaranteed time-specific deliveries, contact our sales team about white-glove delivery options.",
  },
  {
    id: "sf2",
    question:
      "Can I use my own shipping account (UPS, FedEx, etc.)?",
    answer:
      "Yes, for large or recurring orders, we can arrange to use your corporate shipping account. This option is available for verified business customers with active carrier accounts. Contact our customer success team to set up third-party billing. Note that you'll be responsible for all shipping costs and any carrier-related issues when using your own account.",
  },
  {
    id: "sf3",
    question: "What happens if a delivery attempt fails?",
    answer:
      "For Uber Direct: The courier will contact you directly to arrange an alternative delivery time or safe drop-off location. For Shippo carriers: Standard carrier policies apply—typically 2-3 delivery attempts before the package is held at a local facility or returned to sender. You'll receive notifications for each attempt and can redirect the package through the carrier's tracking portal or contact our support team for assistance.",
  },
  {
    id: "sf4",
    question:
      "Do you support pallet shipments for large bulk orders?",
    answer:
      "Yes, we support pallet and LTL (Less Than Truckload) shipments through Shippo for bulk orders. Pallet shipments are ideal for large equipment, multiple cases of supplies, or consolidated orders for multi-location practices. These shipments require freight carrier scheduling and may need delivery appointments. Contact our B2B sales team for freight quotes and specialized handling requirements.",
  },
  {
    id: "sf5",
    question: "Do you ship internationally?",
    answer:
      "Yes, international shipping is available through Shippo to select countries. International orders require additional customs documentation and may be subject to import duties, taxes, and regulatory compliance requirements. Delivery times vary significantly by destination (typically 5-15 business days). Some products may have export restrictions. Contact our international sales team to verify eligibility and obtain accurate quotes for your specific destination.",
  },
  {
    id: "sf6",
    question: "Is Uber Direct available in my area?",
    answer:
      "Uber Direct same-day service is currently available in major metropolitan areas including New York, Los Angeles, Chicago, Houston, Phoenix, Philadelphia, San Antonio, San Diego, Dallas, and San Jose, with ongoing expansion to additional cities. Enter your delivery address during checkout to see if same-day delivery is available. If Uber Direct is not available in your location, standard Shippo shipping options will be displayed.",
  },
  {
    id: "sf7",
    question:
      "What if I need to change my delivery address after ordering?",
    answer:
      "Address changes are possible if the order hasn't been shipped yet. Contact our support team immediately with your order number and new address. Once a shipment is in transit, address changes must be made directly through the carrier's tracking portal (may incur additional fees). For Uber Direct orders, address changes are not possible once the courier has picked up the package.",
  },
  {
    id: "sf8",
    question:
      "Are there any items that cannot be shipped?",
    answer:
      "Certain hazardous materials, controlled substances, and items requiring special permits may have shipping restrictions based on carrier policies and regulatory requirements. Temperature-controlled biologicals and pharmaceuticals may require specialized cold chain shipping (additional fees apply). Products with shipping restrictions are clearly marked on their detail pages. Contact our compliance team if you have questions about specific products.",
  },
]

export default function ShippingFAQSection() {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <section
      id="faq-section"
      className="py-12 sm:py-16 lg:py-20 bg-white"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-steel-blue mb-3 sm:mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600">
            Common shipping questions answered
          </p>
        </div>

        <div className="space-y-4">
          {faqItems.map((item) => {
            const isOpen = openId === item.id
            return (
              <div
                key={item.id}
                className="bg-light-mint-gray rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="w-full text-left p-4 sm:p-6 focus:outline-none"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold text-steel-blue pr-4">
                      {item.question}
                    </h3>
                    <ChevronDown
                      className={`text-gray-400 shrink-0 transition-transform duration-300 ease-in-out ${isOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>
                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-sm sm:text-base text-gray-600">
                      <p>{item.answer}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
