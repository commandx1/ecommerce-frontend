"use client"

import { Book, Camera, CheckCircle, Disc, Info, Package, ShieldCheck, Syringe, Usb, Wrench } from "lucide-react"
import { useState } from "react"

interface Description {
  paragraphs: string[]
  benefits: string[]
  included: Array<{ icon: string; text: string }>
  installationNote: {
    title: string
    text: string
  }
}

interface ProductDetailsTabsProps {
  description: Description
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  camera: Camera,
  usb: Usb,
  disc: Disc,
  book: Book,
  "shield-check": ShieldCheck,
  tools: Wrench,
  package: Package,
  syringe: Syringe,
  scissors: Wrench,
  box: Package,
}

const ProductDetailsTabs = ({ description }: ProductDetailsTabsProps) => {
  const [activeTab, setActiveTab] = useState("Description")

  return (
    <section id="product-details-tabs" className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {["Description", "Features", "Installation", "Support", "Downloads"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 py-4 px-1 font-medium transition-colors ${
                  activeTab === tab
                    ? "border-steel-blue text-steel-blue font-semibold"
                    : "border-transparent text-gray-500 hover:text-steel-blue"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="py-8">
          {activeTab === "Description" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-steel-blue">Product Description</h3>
                {description.paragraphs.map((paragraph) => (
                  <p key={paragraph.substring(0, 30)} className="text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                ))}

                <div className="bg-light-mint-gray rounded-xl p-6">
                  <h4 className="font-semibold text-steel-blue mb-4">Key Benefits</h4>
                  <ul className="space-y-3">
                    {description.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start space-x-3">
                        <CheckCircle className="text-green-500 mt-1 shrink-0" />
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-steel-blue">What's Included</h3>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="grid grid-cols-1 gap-4">
                    {description.included.map((item) => {
                      const IconComponent = iconMap[item.icon]
                      return (
                        <div key={item.text} className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-steel-blue rounded-full flex items-center justify-center shrink-0">
                            {IconComponent && <IconComponent className="text-white text-sm w-4 h-4" />}
                          </div>
                          <span className="text-gray-700">{item.text}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <div className="flex items-start space-x-3">
                    <Info className="text-yellow-600 text-lg mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 mb-2">{description.installationNote.title}</h4>
                      <p className="text-yellow-700 text-sm">{description.installationNote.text}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== "Description" && (
            <div className="py-8 text-center text-gray-600">
              <p>{activeTab} content coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default ProductDetailsTabs
