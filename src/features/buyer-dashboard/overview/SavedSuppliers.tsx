import {
  Award,
  Award as CertificateIcon,
  CheckCircle,
  GraduationCap,
  Heart,
  Leaf,
  type LucideIcon,
  Microscope,
  Phone,
  Recycle,
  Smile,
  Star,
  Store,
  Truck,
  Wrench,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import dashboardSuppliersData from "@/data/dashboard-suppliers.json"

const iconMap: Record<string, LucideIcon> = {
  store: Store,
  microscope: Microscope,
  teeth: Smile,
  leaf: Leaf,
}

const featureIconMap: Record<string, LucideIcon> = {
  "check-circle": CheckCircle,
  truck: Truck,
  tools: Wrench,
  phone: Phone,
  award: Award,
  "graduation-cap": GraduationCap,
  recycle: Recycle,
  certificate: CertificateIcon,
}

const colorMap: Record<string, string> = {
  orange: "bg-coral-orange/20 text-coral-orange",
  blue: "bg-brand/15 text-brand",
  purple: "bg-warning/20 text-warning",
  green: "bg-success/15 text-success",
}

const featureColorMap: Record<string, string> = {
  green: "text-success",
  "steel-blue": "text-brand",
}

const SavedSuppliers = () => {
  const renderStars = (starCount: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const starId = `saved-supplier-star-${i + 1}`
      return (
        <Star
          key={starId}
          className={`h-3 w-3 ${i < starCount ? "fill-accent-strong text-accent-strong" : "fill-none text-border-strong"}`}
        />
      )
    })
  }

  return (
    <div className="rounded-xl border border-border-soft bg-surface-elevated shadow-soft">
      <div className="border-b border-border-soft p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">Saved Suppliers</h2>
          <Button type="button" variant="link" size="sm" className="h-auto p-0">
            Manage All
          </Button>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dashboardSuppliersData.savedSuppliers.map((supplier) => {
            const IconComponent = iconMap[supplier.icon]
            const iconColorClass = colorMap[supplier.iconColor] || "bg-surface-muted text-text-secondary"

            return (
              <div
                key={supplier.id}
                className="rounded-lg border border-border-soft p-4 transition-shadow hover:shadow-soft"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconColorClass}`}>
                      {IconComponent && <IconComponent className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">{supplier.name}</h3>
                      <div className="flex items-center text-xs text-text-secondary">
                        <div className="mr-1 flex">{renderStars(supplier.starCount)}</div>
                        <span>{supplier.rating}</span>
                      </div>
                    </div>
                  </div>
                  <Button type="button" variant="quiet" size="icon-sm" className="text-danger hover:opacity-80">
                    <Heart className="w-5 h-5 fill-current" />
                  </Button>
                </div>
                <div className="mb-3 text-xs text-text-secondary">
                  {supplier.features.map((feature) => {
                    const FeatureIcon = featureIconMap[feature.icon]
                    const featureColorClass = featureColorMap[feature.color] || "text-text-muted"
                    return (
                      <div key={feature.text} className="flex items-center mb-1">
                        {FeatureIcon && <FeatureIcon className={`${featureColorClass} mr-1 w-3 h-3`} />}
                        <span>{feature.text}</span>
                      </div>
                    )
                  })}
                </div>
                <Button
                  type="button"
                  variant="unstyled"
                  className="w-full rounded bg-brand px-3 py-2 text-xs text-primary-foreground transition-colors hover:bg-brand-strong"
                >
                  View Catalog
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default SavedSuppliers
