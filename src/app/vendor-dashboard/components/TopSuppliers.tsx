import { type LucideIcon, Microscope, Smile, Star, Store } from "lucide-react"
import Link from "next/link"
import dashboardSuppliersData from "@/data/dashboard-suppliers.json"

const iconMap: Record<string, LucideIcon> = {
  store: Store,
  microscope: Microscope,
  teeth: Smile,
}

const colorMap: Record<string, string> = {
  orange: "bg-orange-100 text-orange-600",
  blue: "bg-blue-100 text-blue-600",
  purple: "bg-purple-100 text-purple-600",
}

const TopSuppliers = () => {
  const renderStars = (starCount: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const starId = `top-supplier-star-${i + 1}`
      return (
        <Star
          key={starId}
          className={`w-3 h-3 ${i < starCount ? "fill-yellow-400 text-yellow-400" : "fill-none text-gray-300"}`}
        />
      )
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-steel-blue">Top Suppliers</h2>
        <p className="text-sm text-gray-600 mt-1">Your most frequently used suppliers</p>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {dashboardSuppliersData.topSuppliers.map((supplier) => {
            const IconComponent = iconMap[supplier.icon]
            const iconColorClass = colorMap[supplier.iconColor] || "bg-gray-100 text-gray-600"

            return (
              <div key={supplier.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 ${iconColorClass} rounded-lg flex items-center justify-center`}>
                    {IconComponent && <IconComponent className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-steel-blue">{supplier.name}</h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="flex text-yellow-400 mr-2">{renderStars(supplier.starCount)}</div>
                      <span>{supplier.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-steel-blue">{supplier.totalSpent}</div>
                  <div className="text-sm text-gray-500">{supplier.orderCount}</div>
                </div>
              </div>
            )
          })}

          <div className="pt-4 border-t border-gray-200">
            <Link href="/suppliers" className="w-full text-steel-blue hover:underline font-medium block text-center">
              View All Suppliers
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TopSuppliers
