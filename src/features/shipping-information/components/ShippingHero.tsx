import { MapPin, Package, Truck, Zap } from "lucide-react"
import PageSectionContainer from "@/components/layout/PageSectionContainer"

const HERO_FEATURES = [
  { icon: Zap, title: "Same-Day Delivery", description: "Local courier service" },
  { icon: Truck, title: "Multi-Carrier", description: "National & international" },
  { icon: MapPin, title: "Real-Time Tracking", description: "Full transparency" },
  { icon: Package, title: "Bulk Orders", description: "Enterprise fulfillment" },
] as const

export default function ShippingHero() {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <PageSectionContainer as="div">
        <div className="home-nebula home-spotlight rounded-[2rem] border border-border-soft bg-surface-elevated px-6 py-8 sm:px-10 sm:py-12 lg:px-14">
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-3xl font-bold text-text-primary sm:mb-6 sm:text-4xl lg:text-5xl">
              Shipping Information
            </h1>
            <p className="mx-auto max-w-3xl px-4 text-lg leading-relaxed text-text-secondary sm:text-xl lg:text-2xl">
              Reliable and scalable delivery solutions powered by Uber Direct and Shippo
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
            {HERO_FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-border-soft/80 bg-surface/90 p-4 text-center shadow-soft sm:p-6"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-surface sm:mb-4 sm:h-16 sm:w-16">
                  <Icon className="h-6 w-6 text-inverse-foreground sm:h-8 sm:w-8" />
                </div>
                <h3 className="mb-1 text-sm font-semibold text-text-primary sm:mb-2 sm:text-base">{title}</h3>
                <p className="text-xs text-text-secondary sm:text-sm">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </PageSectionContainer>
    </section>
  )
}
