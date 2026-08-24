import { Award, CheckCircle, GraduationCap, Phone, ShieldCheck, Truck, Wrench } from "lucide-react"
import Image from "next/image"
import type { ComponentType } from "react"
import { SpotlightCard } from "@/components/ui/spotlight-card"
import StarRating from "@/features/home/components/StarRating"

interface Feature {
  icon: string
  iconColor: string
  text: string
}

interface SupplierCardProps {
  name: string
  logo: string
  alt: string
  rating: number
  starCount: number
  reviewCount: string
  features: Feature[]
}

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  "check-circle": CheckCircle,
  truck: Truck,
  "shield-check": ShieldCheck,
  tools: Wrench,
  phone: Phone,
  "graduation-cap": GraduationCap,
  award: Award,
}

const colorMap: Record<string, string> = {
  green: "text-success",
  "steel-blue": "text-brand",
}

export default function SupplierCard({ name, logo, alt, rating, starCount, reviewCount, features }: SupplierCardProps) {
  return (
    <SpotlightCard
      radius={28}
      className="rounded-[1.75rem] shadow-soft transition-all hover:-translate-y-1 hover:shadow-panel"
    >
      <div className="overflow-hidden rounded-[1.75rem] bg-surface-elevated p-8">
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-[color:color-mix(in_oklab,var(--success)_14%,var(--surface))] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-success">
            Verified partner
          </span>
          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-text-muted">
            High trust fit
          </span>
        </div>
        <div className="mb-6 flex items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] border border-border-soft bg-surface shadow-soft">
            <Image className="h-12 w-12 object-contain" src={logo} alt={alt} width={48} height={48} />
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-semibold text-text-primary">{name}</h3>
            <div className="flex items-center text-sm text-text-secondary">
              <StarRating filledCount={starCount} sizeClassName="w-4 h-4" />
              <span className="ml-2">
                {rating} ({reviewCount} reviews)
              </span>
            </div>
          </div>
        </div>
        <div className="mb-6 space-y-3">
          {features.map((feature) => {
            const IconComponent = iconMap[feature.icon]
            const iconColorClass = colorMap[feature.iconColor] || "text-text-muted"
            return (
              <div key={feature.text} className="flex items-center text-sm text-text-secondary">
                {IconComponent ? <IconComponent className={`${iconColorClass} mr-2 h-4 w-4`} /> : null}
                <span>{feature.text}</span>
              </div>
            )
          })}
        </div>
        <div className="mb-5 rounded-[1.1rem] border border-border-soft bg-surface p-4">
          <div className="text-sm font-semibold text-text-primary">Why this supplier stays memorable</div>
          <div className="mt-2 text-sm leading-6 text-text-secondary">
            Strong supplier cards reduce bounce by packaging proof, differentiation, and next action into one compact
            decision surface.
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            className="flex-1 rounded-full bg-brand px-4 py-2.5 font-medium text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-brand-strong"
          >
            View Catalog
          </button>
          <button
            type="button"
            className="rounded-full border border-border-strong px-4 py-2.5 text-brand transition-colors hover:bg-accent"
            aria-label="Add to favorites"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <title>Add to favorites</title>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
        </div>
      </div>
    </SpotlightCard>
  )
}
