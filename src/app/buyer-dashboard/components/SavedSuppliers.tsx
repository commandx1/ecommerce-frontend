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
  orange: "bg-orange-100 text-orange-600",
  blue: "bg-blue-100 text-blue-600",
  purple: "bg-purple-100 text-purple-600",
  green: "bg-green-100 text-green-600",
}

const featureColorMap: Record<string, string> = {
  green: "text-green-500",
  "steel-blue": "text-steel-blue",
}

const SavedSuppliers = () => {
  const renderStars = (starCount: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const starId = `saved-supplier-star-${i + 1}`
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
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-steel-blue">Saved Suppliers</h2>
          <button type="button" className="text-steel-blue hover:underline font-medium">
            Manage All
          </button>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dashboardSuppliersData.savedSuppliers.map((supplier) => {
            const IconComponent = iconMap[supplier.icon]
            const iconColorClass = colorMap[supplier.iconColor] || "bg-gray-100 text-gray-600"

            return (
              <div
                key={supplier.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${iconColorClass} rounded-lg flex items-center justify-center`}>
                      {IconComponent && <IconComponent className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-steel-blue text-sm">{supplier.name}</h3>
                      <div className="flex items-center text-xs text-gray-600">
                        <div className="flex text-yellow-400 mr-1">{renderStars(supplier.starCount)}</div>
                        <span>{supplier.rating}</span>
                      </div>
                    </div>
                  </div>
                  <button type="button" className="text-red-500 hover:text-red-700">
                    <Heart className="w-5 h-5 fill-current" />
                  </button>
                </div>
                <div className="text-xs text-gray-600 mb-3">
                  {supplier.features.map((feature) => {
                    const FeatureIcon = featureIconMap[feature.icon]
                    const featureColorClass = featureColorMap[feature.color] || "text-gray-500"
                    return (
                      <div key={feature.text} className="flex items-center mb-1">
                        {FeatureIcon && <FeatureIcon className={`${featureColorClass} mr-1 w-3 h-3`} />}
                        <span>{feature.text}</span>
                      </div>
                    )
                  })}
                </div>
                <button
                  type="button"
                  className="w-full bg-steel-blue text-white py-2 px-3 rounded text-xs hover:bg-opacity-90"
                >
                  View Catalog
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default SavedSuppliers
