import { type LucideIcon, Microscope, Smile, Star, Store } from "lucide-react"
import Link from "next/link"
import dashboardSuppliersData from "@/data/dashboard-suppliers.json"

const iconMap: Record<string, LucideIcon> = {
  store: Store,
  microscope: Microscope,
  teeth: Smile,
}

const colorMap: Record<string, string> = {
  orange: "bg-coral-orange/20 text-coral-orange",
  blue: "bg-brand/15 text-brand",
  purple: "bg-warning/20 text-warning",
}

const TopSuppliers = () => {
  const renderStars = (starCount: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const starId = `top-supplier-star-${i + 1}`
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
        <h2 className="text-xl font-semibold text-text-primary">Top Suppliers</h2>
        <p className="mt-1 text-sm text-text-secondary">Your most frequently used suppliers</p>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {dashboardSuppliersData.topSuppliers.map((supplier) => {
            const IconComponent = iconMap[supplier.icon]
            const iconColorClass = colorMap[supplier.iconColor] || "bg-surface-muted text-text-secondary"

            return (
              <div key={supplier.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 ${iconColorClass} rounded-lg flex items-center justify-center`}>
                    {IconComponent && <IconComponent className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">{supplier.name}</h3>
                    <div className="flex items-center text-sm text-text-secondary">
                      <div className="mr-2 flex">{renderStars(supplier.starCount)}</div>
                      <span>{supplier.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-text-primary">{supplier.totalSpent}</div>
                  <div className="text-sm text-text-muted">{supplier.orderCount}</div>
                </div>
              </div>
            )
          })}

          <div className="border-t border-border-soft pt-4">
            <Link href="/suppliers" className="block w-full text-center font-medium text-brand hover:underline">
              View All Suppliers
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TopSuppliers
