"use client"

import { Book, Camera, CheckCircle, Disc, Info, Package, ShieldCheck, Syringe, Usb, Wrench } from "lucide-react"
import { useMemo, useState } from "react"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import type { ProductDescriptionContent } from "../types"

interface ProductDetailsTabsProps {
  description: ProductDescriptionContent
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

const tabs = ["Description", "Features", "Installation", "Support", "Downloads"] as const

const ProductDetailsTabs = ({ description }: ProductDetailsTabsProps) => {
  const [activeTab, setActiveTab] = useState("Description")
  const paragraphs = useMemo(() => {
    return description.paragraphs.length > 0
      ? description.paragraphs
      : ["Professional-grade product designed for daily clinical workflows."]
  }, [description.paragraphs])
  const benefits = description.benefits.length
    ? description.benefits
    : ["Professional grade materials", "Verified supplier network", "Reliable delivery timelines"]
  const includedItems = description.included.length
    ? description.included
    : [{ icon: "box", text: "Protective case and accessories" }]

  return (
    <section className="bg-canvas py-12">
      <PageSectionContainer as="div">
        <div className="border-b border-border-soft">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-1 py-4 font-medium transition-colors ${
                  activeTab === tab
                    ? "border-brand text-brand font-semibold"
                    : "border-transparent text-text-secondary hover:text-brand"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="py-8">
          {activeTab === "Description" && (
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-text-primary">Product Description</h3>
                {paragraphs.map((paragraph) => (
                  <p key={paragraph.substring(0, 30)} className="leading-relaxed text-text-secondary">
                    {paragraph}
                  </p>
                ))}

                <div className="rounded-[1.5rem] border border-border-soft bg-surface-elevated p-6 shadow-soft">
                  <h4 className="mb-4 font-semibold text-text-primary">Key Benefits</h4>
                  <ul className="space-y-3">
                    {benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start space-x-3">
                        <CheckCircle className="mt-1 shrink-0 text-success" />
                        <span className="text-text-secondary">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-text-primary">What's Included</h3>
                <div className="rounded-[1.5rem] border border-border-soft bg-surface-elevated p-6 shadow-soft">
                  <div className="grid grid-cols-1 gap-4">
                    {includedItems.map((item) => {
                      const IconComponent = iconMap[item.icon]
                      return (
                        <div key={item.text} className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-primary-foreground">
                            {IconComponent && <IconComponent className="h-4 w-4 text-sm" />}
                          </div>
                          <span className="text-text-secondary">{item.text}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-warning/25 bg-warning/10 p-6">
                  <div className="flex items-start space-x-3">
                    <Info className="mt-0.5 shrink-0 text-lg text-warning" />
                    <div>
                      <h4 className="mb-2 font-semibold text-text-primary">{description.installationNote.title}</h4>
                      <p className="text-sm text-text-secondary">{description.installationNote.text}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== "Description" && (
            <div className="py-8 text-center text-text-secondary">
              <p>{activeTab} content coming soon...</p>
            </div>
          )}
        </div>
      </PageSectionContainer>
    </section>
  )
}

export default ProductDetailsTabs
